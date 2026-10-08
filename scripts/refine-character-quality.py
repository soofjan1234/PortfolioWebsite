"""从第一版编辑源精修人物；候选通过校验后才发布，第一版始终可恢复。

运行：.codex-model-tools/bin/python scripts/refine-character-quality.py --stage=skin
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import struct
import time

import numpy as np

# 所有候选和中间贴图均属于同一主题，交付文件不作为实验写入目标。
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs/changes/2026-10-04-character-resume/assets/model"
EVIDENCE = ASSETS / "quality-refinement"
SOURCE = ASSETS / "hou-scene-v1.blend"
CANDIDATE = ROOT / "public/models/me-quality-candidate.glb"
STAGES = ("skin", "eyes", "hair", "final")
# 只改变默认注视方向，不挪动眼眶与球心；两侧各向外约 7°，扩大可见瞳孔间距。
EYE_OUTWARD_ANGLE = .12
# 取眼角相邻健康皮肤的线性底色；旧值的红通道偏低，使修补带显灰青。
EYE_SKIN_COLOR = (.74, .275, .16)
# 第一版减面使发梢边界偏离对应长边约 0.000855；投影容差略大于实测值，焊接仍更严格。
SEAM_PROJECTION_TOLERANCE = .001
SEAM_WELD_TOLERANCE = .0007


def smoothstep(low, high, values):
    """平滑区域权重，避免贴图中出现硬边。"""
    value = np.clip((values-low)/(high-low), 0, 1)
    return value*value*(3-2*value)


def skin_weights(colors, positions):
    """用底色和位置保护白牙、黑眉、口腔与衣服碎片，只调整皮肤。"""
    red, green, blue = np.asarray(colors).T[:3]
    x, y, z = np.asarray(positions).T
    chroma = red-np.minimum(green, blue)
    weight = smoothstep(.20, .40, red)*smoothstep(.10, .22, chroma)
    weight *= smoothstep(.045, .12, red-green)
    # 暖红鼻尖和耳朵仍属于皮肤；高色差保护只在实际嘴唇区域生效。
    mouth = (1-smoothstep(.15, .21, np.abs(x)))*(1-smoothstep(.05, .09, np.abs(z+.02)))
    mouth *= smoothstep(-.18, -.28, y)
    weight *= 1-mouth*smoothstep(.23, .32, red-green)
    weight *= 1-smoothstep(.30, .42, np.abs(x))* (1-smoothstep(-.65, -.43, z))
    return np.clip(weight, 0, 1)


def validate_uv(uv):
    """在读取像素前拒绝缺失、非有限或越界的源贴图坐标。"""
    values = np.asarray(uv)
    if values.ndim != 2 or values.shape[1] != 2 or not len(values):
        raise ValueError("缺少有效 UV")
    if not np.isfinite(values).all() or values.min() < -.0001 or values.max() > 1.0001:
        raise ValueError("UV 坐标非有限或超出源纹理范围")


def order_boundary(edges):
    """将单一闭合边界排序；拒绝开口、分叉和不连通的边集。"""
    adjacency = {}
    for start, end in edges:
        adjacency.setdefault(start, []).append(end)
        adjacency.setdefault(end, []).append(start)
    if len(adjacency) < 3 or any(len(neighbors) != 2 for neighbors in adjacency.values()):
        raise ValueError("眼窝边界不是闭合二度环")
    first = min(adjacency)
    ordered, previous, current = [first], None, first
    while True:
        next_vertex = next(vertex for vertex in sorted(adjacency[current]) if vertex != previous)
        if next_vertex == first:
            break
        if next_vertex in ordered:
            raise ValueError("眼窝边界重复经过顶点")
        ordered.append(next_vertex)
        previous, current = current, next_vertex
    if len(ordered) != len(adjacency):
        raise ValueError("眼窝边界包含多个独立闭环")
    return ordered


def sha256(path):
    """以内容哈希记录输入输出身份。"""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def activate(obj):
    """限定 Blender 操作的活动对象，避免烘焙或编辑其他网格。"""
    import bpy
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def node(material, kind):
    """在指定材质中创建节点，集中保持节点所有权。"""
    return material.node_tree.nodes.new(kind)


def color_attribute(obj, name, values):
    """把每面角的权重写成浮点颜色属性，供材质烘焙使用。"""
    attribute = obj.data.color_attributes.new(name=name, type="FLOAT_COLOR", domain="CORNER")
    array = np.ones((len(values), 4), dtype=np.float32)
    array[:, :3] = np.asarray(values)[:, None] if np.asarray(values).ndim == 1 else values
    attribute.data.foreach_set("color", array.ravel())
    return attribute


def attribute_node(material, name):
    """读取指定烘焙属性，不依赖活动颜色属性的隐式顺序。"""
    result = node(material, "ShaderNodeVertexColor")
    result.layer_name = name
    return result.outputs["Color"]


def remove_bake_attributes(mesh):
    """每次按名字重新取属性；删除会重排底层数组，旧句柄不能复用。"""
    names = [attribute.name for attribute in mesh.color_attributes if attribute.name.startswith("Quality")]
    for name in names:
        mesh.color_attributes.remove(mesh.color_attributes[name])


def bake_signal(obj, material, socket, name, size=2048, color=True):
    """把程序材质信号烘焙为 GLB 可携带的贴图，不把离线节点留给网页。"""
    import bpy
    activate(obj)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 1
    scene.render.bake.use_clear = True
    image = bpy.data.images.new(name, width=size, height=size, alpha=False)
    image.colorspace_settings.name = "sRGB" if color else "Non-Color"
    texture = node(material, "ShaderNodeTexImage")
    texture.image = image
    material.node_tree.nodes.active = texture
    output = next(entry for entry in material.node_tree.nodes if entry.type == "OUTPUT_MATERIAL")
    previous = output.inputs["Surface"].links[0].from_socket
    emission = node(material, "ShaderNodeEmission")
    links = material.node_tree.links
    links.new(socket, emission.inputs["Color"])
    links.new(emission.outputs[0], output.inputs["Surface"])
    bpy.ops.object.bake(type="EMIT", margin=16)
    links.new(previous, output.inputs["Surface"])
    material.node_tree.nodes.remove(emission)
    image.filepath_raw = str(EVIDENCE / f"{name}.png")
    image.file_format = "PNG"
    image.save()
    image.pack()
    return texture


def unique_material(obj, name):
    """解除第一版的共用材质，保持网格及原 UV 不变。"""
    material = obj.data.materials[0].copy()
    material.name = name
    obj.data.materials[0] = material
    return material, material.node_tree.nodes.get("Principled BSDF")


def set_input(material, shader, name, value):
    """用明确的常量覆盖原输入及其链接。"""
    for link in list(shader.inputs[name].links):
        material.node_tree.links.remove(link)
    shader.inputs[name].default_value = value


def clean_brow_colors(mesh, colors, positions):
    """在眉毛局部改用连续的顶点色，滤掉原贴图中拉丝状的深色碎边。"""
    indices = np.array([loop.vertex_index for loop in mesh.loops])
    sums = np.zeros((len(mesh.vertices), 3))
    np.add.at(sums, indices, colors)
    counts = np.bincount(indices, minlength=len(mesh.vertices))
    averaged = sums/np.maximum(counts[:, None], 1)
    neighbors = [set() for _ in mesh.vertices]
    for edge in mesh.edges:
        a, b = edge.vertices
        neighbors[a].add(b)
        neighbors[b].add(a)
    # 只平滑颜色，不移动眉毛网格；三轮邻域均值消除小于一个三角面的纹理碎片。
    for _ in range(3):
        adjacent = np.array([averaged[list(group)].mean(0) if group else averaged[i]
                             for i, group in enumerate(neighbors)])
        averaged = .6*averaged+.4*adjacent
    x, y, z = positions.T
    band = smoothstep(.405, .435, z)*(1-smoothstep(.55, .58, z))
    band *= smoothstep(.025, .055, np.abs(x))*(1-smoothstep(.265, .295, np.abs(x)))
    band *= smoothstep(-.21, -.27, y)
    return averaged[indices], band


def select_surface_patch(mesh, region):
    """按已确认的孤立分量位置选择碎片，避免切割连续的主形体。"""
    unseen, patch = set(mesh.verts), set()
    while unseen:
        group = {unseen.pop()}
        pending = list(group)
        while pending:
            for edge in pending.pop().link_edges:
                for vertex in edge.verts:
                    if vertex in unseen:
                        unseen.remove(vertex)
                        group.add(vertex)
                        pending.append(vertex)
        center = np.mean([vertex.co[:] for vertex in group], axis=0)
        if region(center):
            patch.update(group)
    if not patch:
        raise ValueError("未找到预期表面碎片，停止接缝修复")
    return patch


def seal_stitch_slivers(mesh, local, tag):
    """只封合本次焊接处的微小三角裂口，不扩大修复到主体已有边界。"""
    import bmesh
    local = set(local)
    unseen = {edge for edge in mesh.edges if edge.is_boundary and all(v in local for v in edge.verts)}
    filled = 0
    while unseen:
        group = {unseen.pop()}
        pending = list(group)
        while pending:
            for vertex in pending.pop().verts:
                for edge in vertex.link_edges:
                    if edge in unseen:
                        unseen.remove(edge)
                        group.add(edge)
                        pending.append(edge)
        vertices = {v for edge in group for v in edge.verts}
        if len(group) != 3 or len(vertices) != 3 or not any(edge.link_faces[0][tag] for edge in group):
            continue
        a, b, c = [v.co for v in vertices]
        longest = max(edge.calc_length() for edge in group)
        width = (b-a).cross(c-a).length/longest
        # 实测侧发缝长 0.0032、宽 0.00055；仅接受宽度小于既有焊接容差的短裂口。
        if longest > 4*SEAM_PROJECTION_TOLERANCE or width > SEAM_WELD_TOLERANCE:
            continue
        faces = bmesh.ops.holes_fill(mesh, edges=list(group), sides=3)["faces"]
        for face in faces:
            face[tag], face.material_index, face.smooth = 1, 0, True
        filled += len(faces)
    return filled


def join_surface_patch(source, target, patch, uv_at=None, seal_slivers=False):
    """把碎片接回相邻主体；先补 T 接点，再焊接并移除原碎片。"""
    import bmesh
    from mathutils.geometry import intersect_point_line
    faces = {face for vertex in patch for face in vertex.link_faces}
    boundary = {vertex for vertex in patch if any(edge.is_boundary for edge in vertex.link_edges)}
    # 1. 减面后的长边可能跨过另一侧的中间顶点，先切开才可能形成真正共边。
    split_count = 0
    for vertex in boundary:
        edges = [edge for edge in target.edges if edge.is_boundary]
        if any((vertex.co-other.co).length < SEAM_WELD_TOLERANCE for edge in edges for other in edge.verts):
            continue
        closest = None
        for edge in edges:
            point, factor = intersect_point_line(vertex.co, edge.verts[0].co, edge.verts[1].co)
            distance = (point-vertex.co).length
            if 0 < factor < 1 and distance < SEAM_PROJECTION_TOLERANCE and (closest is None or distance < closest[0]):
                closest = (distance, edge, factor)
        if closest:
            _, edge, factor = closest
            _, inserted = bmesh.utils.edge_split(edge, edge.verts[0], factor)
            inserted.co = vertex.co
            split_count += 1
    # 两侧减面比例不同，主体也可能保留碎片长边中间的顶点，须反向补齐一次。
    target_boundary = {vertex for edge in target.edges if edge.is_boundary for vertex in edge.verts}
    for vertex in target_boundary:
        if any((vertex.co-other.co).length < SEAM_WELD_TOLERANCE for other in patch):
            continue
        edges = {edge for other in patch for edge in other.link_edges if edge.is_boundary}
        closest = None
        for edge in edges:
            point, factor = intersect_point_line(vertex.co, edge.verts[0].co, edge.verts[1].co)
            distance = (point-vertex.co).length
            if 0 < factor < 1 and distance < SEAM_PROJECTION_TOLERANCE and (closest is None or distance < closest[0]):
                closest = (distance, edge, factor)
        if closest:
            _, edge, factor = closest
            _, inserted = bmesh.utils.edge_split(edge, edge.verts[0], factor)
            inserted.co = vertex.co
            patch.add(inserted)
            split_count += 1
    # 2. 新面沿用主体材质；需要纹理的部位由原始表面采样恢复 UV。
    uv_layer = target.loops.layers.uv.active
    tag = target.faces.layers.int.new("QualityStitch")
    mapping = {vertex: target.verts.new(vertex.co) for vertex in patch}
    for face in faces:
        joined = target.faces.new([mapping[vertex] for vertex in face.verts])
        joined[tag], joined.material_index, joined.smooth = 1, 0, True
        if uv_at:
            # 同一目标面的所有面角必须使用同一原始 UV 分区，不能逐顶点跨缝选岛。
            anchor = face.calc_center_median()
            for loop in joined.loops:
                loop[uv_layer].uv = uv_at(loop.vert.co, anchor)
    bounds = np.array([vertex.co[:] for vertex in patch])
    low, high = bounds.min(axis=0)-.001, bounds.max(axis=0)+.001
    local = [vertex for vertex in target.verts
             if np.all(np.array(vertex.co) >= low) and np.all(np.array(vertex.co) <= high)]
    bmesh.ops.remove_doubles(target, verts=local, dist=SEAM_WELD_TOLERANCE)
    # 顶点焊接会使旧句柄失效，封缝前重新按局部范围取得有效顶点。
    local = [vertex for vertex in target.verts
             if np.all(np.array(vertex.co) >= low) and np.all(np.array(vertex.co) <= high)]
    sealed = seal_stitch_slivers(target, local, tag) if seal_slivers else 0
    open_edges = sum(edge.is_boundary and edge.link_faces[0][tag] == 1 for edge in target.edges)
    if open_edges:
        first = next(edge for edge in target.edges if edge.is_boundary and edge.link_faces[0][tag] == 1)
        raise ValueError(f"表面焊接后仍有 {open_edges} 条开边，首条：{[tuple(v.co) for v in first.verts]}")
    target.faces.layers.int.remove(tag)
    # 3. 不能保留旧表面叠在新表面上，否则会引入新的共面闪烁。
    face_count = len(faces)
    bmesh.ops.delete(source, geom=list(patch), context="VERTS")
    return {"stitchedFaces": face_count, "splitEdges": split_count, "openPatchEdges": open_edges,
            "sealedSliverFaces": sealed}


def stitch_brow_patch():
    """纠正眉毛与刘海的局部误分，接回各自主体并统一接缝法线。"""
    import bpy
    import bmesh
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    from mathutils.geometry import barycentric_transform
    hair = bpy.data.objects["character-hair"]
    head = bpy.data.objects["character-head"]
    hair_mesh, head_mesh = bmesh.new(), bmesh.new()
    hair_mesh.from_mesh(hair.data)
    head_mesh.from_mesh(head.data)
    # 1. 这两组是原分类以高度切断的独立碎片；不重新分类整张脸或主头发。
    brow = select_surface_patch(hair_mesh, lambda c: .50 < c[2] < .54 and c[1] < -.27 and -.16 < c[0] < -.02)
    fringe = select_surface_patch(head_mesh, lambda c: .48 < c[2] < .53 and c[1] < -.35 and abs(c[0]) < .16)
    # 2. 原头发没有 UV，眉部需要从保留的原始模型表面恢复面角 UV。
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ASSETS / "hou-textured-v1.glb"))
    imported = set(bpy.data.objects)-before
    original = next(obj for obj in imported if obj.type == "MESH")
    original.data.calc_loop_triangles()
    triangles = list(original.data.loop_triangles)
    tree = BVHTree.FromPolygons([vertex.co for vertex in original.data.vertices],
                               [tri.vertices[:] for tri in triangles], all_triangles=True)
    source_uv = original.data.uv_layers.active.data

    def sample_uv(position, anchor):
        """以面中心选择原三角面的连续 UV，防止跨岛长三角覆盖其他部位。"""
        _, _, index, _ = tree.find_nearest(anchor)
        triangle = triangles[index]
        points = [original.data.vertices[i].co for i in triangle.vertices]
        uvs = [Vector((*source_uv[i].uv, 0)) for i in triangle.loops]
        return barycentric_transform(position, *points, *uvs).xy

    # 3. 眉毛接回脸，刘海发梢接回头发；头发稍后统一重新展开 UV。
    result = join_surface_patch(hair_mesh, head_mesh, brow, sample_uv)
    result["splitHeadEdges"] = result.pop("splitEdges")
    result["fringe"] = join_surface_patch(head_mesh, hair_mesh, fringe)
    for temporary, obj in [(head_mesh, head), (hair_mesh, hair)]:
        temporary.normal_update()
        temporary.to_mesh(obj.data)
        temporary.free()
    for obj in imported:
        mesh = obj.data if obj.type == "MESH" else None
        bpy.data.objects.remove(obj, do_unlink=True)
        if mesh and not mesh.users:
            bpy.data.meshes.remove(mesh)
    return result


def stitch_side_hair_patch():
    """把左侧头发中错归皮肤的浅色孤片接回头发，并封合原边界。"""
    import bpy
    import bmesh
    head, hair = bpy.data.objects["character-head"], bpy.data.objects["character-hair"]
    head_mesh, hair_mesh = bmesh.new(), bmesh.new()
    head_mesh.from_mesh(head.data)
    hair_mesh.from_mesh(hair.data)
    # 射线和连通分量共同定位到这块 106 面的区域，避免重新分类其他皮肤或头发。
    patch = select_surface_patch(head_mesh, lambda c: -.40 < c[0] < -.37 and .20 < c[1] < .23 and .53 < c[2] < .58)
    result = join_surface_patch(head_mesh, hair_mesh, patch, seal_slivers=True)
    for temporary, obj in [(head_mesh, head), (hair_mesh, hair)]:
        temporary.normal_update()
        temporary.to_mesh(obj.data)
        temporary.free()
    return result


def refine_skin():
    """以受保护的局部暖色与粗糙度变化建立皮肤小样。"""
    import bpy
    head = bpy.data.objects["character-head"]
    # 第一版减面后保留了旧分裂法线；重新计算光滑法线，消除额头的大三角明暗。
    if "custom_normal" in head.data.attributes:
        head.data.attributes.remove(head.data.attributes["custom_normal"])
    material, shader = unique_material(head, "SkinWarmSatin")
    mesh = head.data
    uv = np.empty((len(mesh.loops), 2), dtype=np.float32)
    mesh.uv_layers.active.data.foreach_get("uv", uv.ravel())
    validate_uv(uv)
    base_socket = shader.inputs["Base Color"].links[0].from_socket
    original_image = base_socket.node.image
    width, height = original_image.size
    pixels = np.empty(width*height*4, dtype=np.float32)
    original_image.pixels.foreach_get(pixels)
    pixels = pixels.reshape(height, width, 4)
    colors = pixels[(uv[:, 1]*height).astype(int).clip(0, height-1), (uv[:, 0]*width).astype(int).clip(0, width-1), :3]
    positions = np.array([mesh.vertices[loop.vertex_index].co[:] for loop in mesh.loops])
    # 先清理眉毛碎纹，再计算肤色保护，避免碎纹与皮肤使用互相矛盾的权重。
    brow_colors, brow_region = clean_brow_colors(mesh, colors, positions)
    # 原图像像素是 sRGB，顶点颜色节点输入为线性值，必须转换以免眉毛和额头被提亮。
    linear_brow = np.where(brow_colors <= .04045, brow_colors/12.92, ((brow_colors+.055)/1.055)**2.4)
    color_attribute(head, "QualityBrowColor", linear_brow)
    color_attribute(head, "QualityBrowRegion", brow_region)
    clean_brows = node(material, "ShaderNodeMixRGB")
    material.node_tree.links.new(attribute_node(material, "QualityBrowRegion"), clean_brows.inputs[0])
    material.node_tree.links.new(base_socket, clean_brows.inputs[1])
    material.node_tree.links.new(attribute_node(material, "QualityBrowColor"), clean_brows.inputs[2])
    base_socket = clean_brows.outputs[0]
    colors = colors*(1-brow_region[:, None])+brow_colors*brow_region[:, None]
    mask = skin_weights(colors, positions)
    x, y, z = positions.T
    # 1. 三维区域渐变跨 UV 岛连续；背面和口腔由位置及底色共同保护。
    cheeks = np.exp(-((np.abs(x)-.245)/.105)**2-((z-.15)/.13)**2-((y+.255)/.18)**2)
    nose = np.exp(-(x/.13)**2-((z-.18)/.105)**2-((y+.405)/.14)**2)
    ears = np.exp(-((np.abs(x)-.42)/.105)**2-((z-.10)/.19)**2)
    blush = mask*np.clip(.49*cheeks+.38*nose+.56*ears, 0, .65)
    color_attribute(head, "QualitySkinMask", mask)
    color_attribute(head, "QualityBlush", blush)
    color_attribute(head, "QualityRoughness", .64-.19*nose*mask+.025*ears*mask)
    # 眼窝切除后原贴图仍有白眼球和黑边残片；统一清理窄接合区，不能只过滤深色。
    eye_rim = np.zeros(len(positions))
    eye_remnant = np.zeros(len(positions))
    for eye_name in ["eye-left", "eye-right"]:
        eye = bpy.data.objects[eye_name]
        offset = positions-np.array(eye.location)
        distance = np.linalg.norm(offset, axis=1)
        radius = eye.dimensions.x/2
        region = (1-smoothstep(radius+.009, radius+.022, distance))*smoothstep(-.20, -.27, y)
        eye_rim = np.maximum(eye_rim, region)
        # 外眼角比正面更靠后，必须按各眼球中心限制前后范围，不能复用固定正面深度。
        # 此宽区只参与逐像素白色残留检测，不把邻近正常皮肤和眉毛整片覆盖。
        remnant = (1-smoothstep(radius+.025, radius+.050, distance))
        remnant *= smoothstep(eye.location.y+.025, eye.location.y-.005, y)
        remnant *= 1-smoothstep(eye.location.z+.095, eye.location.z+.115, z)
        eye_remnant = np.maximum(eye_remnant, remnant)
    color_attribute(head, "QualityEyeRim", eye_rim)
    color_attribute(head, "QualityEyeRemnant", eye_remnant)
    links = material.node_tree.links
    # 2. 先压掉底色过浅的奶油感，再叠加低强度局部暖红，保留原有颜色细节。
    multiply = node(material, "ShaderNodeMixRGB")
    multiply.blend_type = "MULTIPLY"
    links.new(attribute_node(material, "QualitySkinMask"), multiply.inputs[0])
    links.new(base_socket, multiply.inputs[1])
    multiply.inputs[2].default_value = (.86, .61, .53, 1)
    tint = node(material, "ShaderNodeMixRGB")
    links.new(attribute_node(material, "QualityBlush"), tint.inputs[0])
    links.new(multiply.outputs[0], tint.inputs[1])
    tint.inputs[2].default_value = (.57, .185, .125, 1)
    mask_texture = bake_signal(head, material, attribute_node(material, "QualitySkinMask"), "skin-mask", size=1024, color=False)
    # 旧眼白可能落在三角面内部，必须从原贴图逐像素识别，不能仅检查顶点采样色。
    # 原眼白的线性蓝通道约 0.88，相邻暖皮肤约 0.31；平滑阈值保留过渡边缘。
    channels = node(material, "ShaderNodeSeparateColor")
    links.new(base_socket, channels.inputs[0])
    white = node(material, "ShaderNodeMapRange")
    white.interpolation_type = "SMOOTHSTEP"
    white.inputs["From Min"].default_value = .40
    white.inputs["From Max"].default_value = .65
    links.new(channels.outputs["Blue"], white.inputs["Value"])
    local_white = node(material, "ShaderNodeMath")
    local_white.operation = "MULTIPLY"
    links.new(white.outputs["Result"], local_white.inputs[0])
    links.new(attribute_node(material, "QualityEyeRemnant"), local_white.inputs[1])
    repair_weight = node(material, "ShaderNodeMath")
    repair_weight.operation = "MAXIMUM"
    links.new(attribute_node(material, "QualityEyeRim"), repair_weight.inputs[0])
    links.new(local_white.outputs[0], repair_weight.inputs[1])
    clean_rim = node(material, "ShaderNodeMixRGB")
    links.new(repair_weight.outputs[0], clean_rim.inputs[0])
    links.new(tint.outputs[0], clean_rim.inputs[1])
    clean_rim.inputs[2].default_value = (*EYE_SKIN_COLOR, 1)
    base = bake_signal(head, material, clean_rim.outputs[0], "skin-basecolor")
    rough = bake_signal(head, material, attribute_node(material, "QualityRoughness"), "skin-roughness", size=1024, color=False)
    links.new(base.outputs["Color"], shader.inputs["Base Color"])
    links.new(rough.outputs["Color"], shader.inputs["Roughness"])
    set_input(material, shader, "Metallic", 0)
    shader.inputs["Specular IOR Level"].default_value = .38
    for entry in material.node_tree.nodes:
        if entry.type == "NORMAL_MAP":
            entry.inputs["Strength"].default_value = .32
    # 3. 删除仅用于烘焙的颜色属性，避免导出 COLOR_0 后再次乘进底色。
    remove_bake_attributes(mesh)
    for name, label, roughness in [("character-shirt", "ShirtCotton", .86), ("character-glasses", "FramesCharcoal", .40)]:
        separate, principled = unique_material(bpy.data.objects[name], label)
        set_input(separate, principled, "Metallic", 0)
        set_input(separate, principled, "Roughness", roughness)
        for entry in separate.node_tree.nodes:
            if entry.type == "NORMAL_MAP":
                entry.inputs["Strength"].default_value = .40 if name == "character-shirt" else .18
    return {"skinLoopCoverage": round(float(np.mean(mask > .5)), 4), "blushMax": round(float(blush.max()), 4), "maskImage": mask_texture.image.name}


def simple_material(name, color, roughness):
    """创建可直接导出的非金属 PBR 材质。"""
    import bpy
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Specular IOR Level"].default_value = .32
    return material


def boundary_components(mesh):
    """读取每个边界分量的顶点与有序闭环，不改动原网格。"""
    import bmesh
    temporary = bmesh.new()
    temporary.from_mesh(mesh)
    temporary.verts.ensure_lookup_table()
    unseen = {edge for edge in temporary.edges if edge.is_boundary}
    groups = []
    while unseen:
        component = {unseen.pop()}
        pending = list(component)
        while pending:
            for vertex in pending.pop().verts:
                for edge in vertex.link_edges:
                    if edge in unseen:
                        unseen.remove(edge)
                        component.add(edge)
                        pending.append(edge)
        edges = [(edge.verts[0].index, edge.verts[1].index) for edge in component]
        groups.append(edges)
    temporary.free()
    return sorted(groups, key=lambda edges: min(min(edge) for edge in edges))


def clear_eye_surface(points, center, radius, clearance=.003):
    """把前侧相交点推出球面包络；额外间隙覆盖三角面弦高与旋转误差。"""
    result = np.asarray(points).copy()
    offset = result-center
    radial_squared = offset[:, 0]**2+offset[:, 2]**2
    envelope = radius+clearance
    selected = (radial_squared < envelope**2) & (offset[:, 1] < 0)
    surface = center[1]-np.sqrt(np.maximum(0, envelope**2-radial_squared[selected]))
    result[selected, 1] = np.minimum(result[selected, 1], surface)
    return result


def build_eyelid(head, edges, eye):
    """沿真实眼窝生成有厚度的眼睑，外表面避开球面，内封边遮住透视缝隙。"""
    import bpy
    ordered = order_boundary(edges)
    center = np.array(eye.location)
    radius = eye.dimensions.x/2
    # 1. 原切口有回折的锯齿。先整理共享边界，再向相邻两圈缓释位移，保持皮肤连续。
    positions = np.array([vertex.co[:] for vertex in head.data.vertices])
    boundary = positions[ordered].copy()
    for _ in range(4):
        boundary = .6*boundary+.2*np.roll(boundary, 1, axis=0)+.2*np.roll(boundary, -1, axis=0)
    displacement = np.zeros_like(positions)
    displacement[ordered] = boundary-positions[ordered]
    neighbors = [set() for _ in head.data.vertices]
    for edge in head.data.edges:
        a, b = edge.vertices
        neighbors[a].add(b)
        neighbors[b].add(a)
    for _ in range(2):
        spread = np.array([displacement[list(group)].mean(0) if group else displacement[i]
                           for i, group in enumerate(neighbors)])
        spread[ordered] = displacement[ordered]
        displacement = spread
    positions += displacement
    # 2. 原眼窝和眼睑同步推出球面，保持共享边界，不在它们之间留下悬空裂口。
    corrected = clear_eye_surface(positions, center, radius)
    for vertex, position in zip(head.data.vertices, corrected):
        vertex.co = position
    head.data.update()
    points = corrected[ordered]
    # 3. 两圈使用相同角序及同一轮廓中心，避免各自平滑后相互交叉、形成背向三角面。
    inner = points.copy()
    contour_center = (points[:, [0, 2]].min(axis=0)+points[:, [0, 2]].max(axis=0))*.5
    inner[:, [0, 2]] = contour_center+(points[:, [0, 2]]-contour_center)*.90
    offset = inner-center
    radial = np.minimum((offset[:, 0]**2+offset[:, 2]**2)/(radius+.003)**2, .985)
    inner[:, [0, 2]] = center[[0, 2]]+offset[:, [0, 2]]
    inner[:, 1] = center[1]-(radius+.003)*np.sqrt(1-radial)
    middle = clear_eye_surface((points+inner)*.5, center, radius)
    # 内侧封边埋入眼球 0.003，构成有厚度的眼睑；外表面仍保持安全间隙。
    # 薄片眼睑与球面留空时，斜视线会从间隙穿到后脑，形成黑色闪边。
    contact_offset = inner-center
    contact = center+contact_offset*((radius-.003)/np.linalg.norm(contact_offset, axis=1))[:, None]
    vertices = np.concatenate([points, middle, inner, contact])
    count = len(points)
    faces = []
    for ring in range(3):
        for index in range(count):
            next_index = (index+1) % count
            faces.append((ring*count+index, ring*count+next_index, (ring+1)*count+next_index, (ring+1)*count+index))
    mesh = bpy.data.meshes.new(f"lid-{eye.name}")
    mesh.from_pydata(vertices.tolist(), [], faces)
    mesh.update()
    # 4. 窄边沿用清理后的眼周肤色，避免把原纹理的锯齿黑边拉伸到新眼睑上。
    material = simple_material(f"LidSkin-{eye.name}", EYE_SKIN_COLOR, .66)
    mesh.materials.append(material)
    for face in mesh.polygons:
        face.use_smooth = True
    lid = bpy.data.objects.new(f"eyelid-{eye.name.removeprefix('eye-')}", mesh)
    bpy.context.scene.collection.objects.link(lid)
    # 5. 明确朝外的法线；过渡带保持静止，独立眼球在其下方转动。
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    if sum(face.normal.y for face in bm.faces) > 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    contact_faces = mesh.attributes.new("EyeContact", type="BOOLEAN", domain="FACE")
    contact_faces.data.foreach_set("value", [False]*(2*count)+[True]*count)
    return {"name": lid.name, "boundaryVertices": count, "contactFaces": count,
            "maxBridge": round(float(np.linalg.norm(inner-points, axis=1).max()), 5)}


def replace_materials(mesh, materials):
    """保存面归属后替换材质；Blender 清空材质槽会重置面索引。"""
    slots = [face.material_index for face in mesh.polygons]
    if max(slots, default=0) >= len(materials):
        raise ValueError("替换材质缺少原面使用的槽位")
    mesh.materials.clear()
    for material in materials:
        mesh.materials.append(material)
    for face, slot in zip(mesh.polygons, slots):
        face.material_index = slot


def eye_texture(eye):
    """以球面 UV 烘焙虹膜放射层次，保留球体和旋转中心。"""
    import bpy
    mesh = eye.data
    radius = eye.dimensions.x/2
    uv = mesh.uv_layers.new(name="EyeUV")
    for face in mesh.polygons:
        values = []
        for index in face.loop_indices:
            x, y, z = mesh.vertices[mesh.loops[index].vertex_index].co
            values.append([math.atan2(z, x)/(2*math.pi)+.5, math.acos(max(-1, min(1, -y/radius)))/math.pi])
        if max(value[0] for value in values)-min(value[0] for value in values) > .5:
            for value in values:
                if value[0] < .5:
                    value[0] += 1
        for index, value in zip(face.loop_indices, values):
            uv.data[index].uv = value
    # 原网格的虹膜/瞳孔分界保持，纹理只增加虹膜的明暗纤维。
    sclera = simple_material("ScleraIvory", (.71, .75, .68), .47)
    iris = simple_material("IrisHazel", (.055, .075, .05), .42)
    pupil = simple_material("PupilSoft", (.006, .008, .007), .38)
    replace_materials(mesh, [sclera, iris, pupil])
    links = iris.node_tree.links
    coord = node(iris, "ShaderNodeTexCoord")
    mapping = node(iris, "ShaderNodeVectorMath")
    mapping.operation = "MULTIPLY"
    mapping.inputs[1].default_value = (220, 4, 1)
    links.new(coord.outputs["UV"], mapping.inputs[0])
    noise = node(iris, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1
    noise.inputs["Detail"].default_value = 2
    links.new(mapping.outputs[0], noise.inputs["Vector"])
    ramp = node(iris, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = .25
    ramp.color_ramp.elements[0].color = (.015, .029, .021, 1)
    ramp.color_ramp.elements[1].position = .75
    ramp.color_ramp.elements[1].color = (.09, .125, .073, 1)
    links.new(noise.outputs["Fac"], ramp.inputs[0])
    # 多材质物体烘焙需每个材质有目标节点，使用独立的临时平面烘焙纹理。
    activate(eye)
    bpy.ops.mesh.primitive_plane_add(size=2)
    plane = bpy.context.object
    plane.name = "QualityIrisBake"
    plane.data.materials.append(iris)
    texture = bake_signal(plane, iris, ramp.outputs[0], f"iris-{eye.name}", size=512)
    links.new(texture.outputs["Color"], iris.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
    bpy.data.objects.remove(plane, do_unlink=True)


def refine_eyes():
    """修复左右真实眼窝，保持球心，并将两侧默认瞳孔稍向外调整。"""
    import bpy
    head = bpy.data.objects["character-head"]
    selected = {}
    for edges in boundary_components(head.data):
        indexes = set(index for edge in edges for index in edge)
        center = np.mean([head.data.vertices[index].co[:] for index in indexes], axis=0)
        if 80 < len(edges) < 250 and center[1] < -.2 and .25 < center[2] < .42:
            side = "left" if center[0] < 0 else "right"
            if side in selected:
                raise ValueError(f"{side} 眼窝边界存在多个候选")
            selected[side] = edges
    if set(selected) != {"left", "right"}:
        raise ValueError("未找到两只独立眼窝，停止眼部精修")
    results = []
    for side in ("left", "right"):
        edges = selected[side]
        eye = bpy.data.objects[f"eye-{side}"]
        result = build_eyelid(head, edges, eye)
        eye_texture(eye)
        eye.rotation_euler.z = EYE_OUTWARD_ANGLE*(-1 if side == "left" else 1)
        result["eyeCenter"] = list(eye.location)
        result["eyeRotation"] = list(eye.rotation_euler)
        results.append(result)
    return results


def refine_hair():
    """在主发束内部局部整理体积，重建 UV 并烘焙哑光层次。"""
    import bpy
    hair = bpy.data.objects["character-hair"]
    mesh = hair.data
    original = np.array([vertex.co[:] for vertex in mesh.vertices])
    boundary = set(index for edges in boundary_components(mesh) for edge in edges for index in edge)
    adjacent = [set() for _ in mesh.vertices]
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacent[a].add(b)
        adjacent[b].add(a)
    fixed = boundary | {neighbor for index in boundary for neighbor in adjacent[index]}
    # 1. 发际线及其相邻一圈固定；只整理头顶和侧扫大块，不影响眉毛与鬓角。
    weights = smoothstep(.56, .74, original[:, 2])
    weights[list(fixed)] = 0
    positions = original.copy()
    for _ in range(7):
        averaged = np.array([positions[list(neighbors)].mean(0) if neighbors else positions[index]
                             for index, neighbors in enumerate(adjacent)])
        positions += (averaged-positions)*weights[:, None]*.28
    normals = np.array([vertex.normal[:] for vertex in mesh.vertices])
    positions += normals*weights[:, None]*.003
    # 最高处的细尖向主发束收拢；边界仍由权重保护，避免拉开发际线。
    positions[:, 2] -= smoothstep(.83, .945, original[:, 2])*weights*.011
    for vertex, position in zip(mesh.vertices, positions):
        vertex.co = position
    if "custom_normal" in mesh.attributes:
        mesh.attributes.remove(mesh.attributes["custom_normal"])
    for face in mesh.polygons:
        face.use_smooth = True
    mesh.update()
    # 2. 当前头发没有 UV；重新展开用于候选贴图，原始第一版不受影响。
    activate(hair)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.012)
    bpy.ops.object.mode_set(mode="OBJECT")
    material = simple_material("HairBlueGraphite", (.013, .021, .026), .73)
    replace_materials(mesh, [material])
    links = material.node_tree.links
    coord = node(material, "ShaderNodeTexCoord")
    mapping = node(material, "ShaderNodeVectorMath")
    mapping.operation = "MULTIPLY"
    mapping.inputs[1].default_value = (2.5, 3.5, 14)
    links.new(coord.outputs["Generated"], mapping.inputs[0])
    noise = node(material, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.8
    noise.inputs["Detail"].default_value = 2
    links.new(mapping.outputs[0], noise.inputs["Vector"])
    ramp = node(material, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (.008, .013, .018, 1)
    ramp.color_ramp.elements[1].color = (.020, .029, .034, 1)
    links.new(noise.outputs["Fac"], ramp.inputs[0])
    base = bake_signal(hair, material, ramp.outputs[0], "hair-basecolor", size=1024)
    rough = node(material, "ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = .65
    rough.inputs["To Max"].default_value = .81
    links.new(noise.outputs["Fac"], rough.inputs["Value"])
    rough_texture = bake_signal(hair, material, rough.outputs[0], "hair-roughness", size=1024, color=False)
    shader = material.node_tree.nodes.get("Principled BSDF")
    links.new(base.outputs["Color"], shader.inputs["Base Color"])
    links.new(rough_texture.outputs["Color"], shader.inputs["Roughness"])
    return {"movedVertices": int(np.sum(np.linalg.norm(positions-original, axis=1) > .00001)),
            "maxDisplacement": round(float(np.linalg.norm(positions-original, axis=1).max()), 6),
            "fixedBoundaryVertices": len(boundary), "uvLayers": len(mesh.uv_layers)}


def strip_unused_tangents(path):
    """移除不使用法线贴图的切线语义，避免无意义 UV 退化阻止有效材质导出。"""
    data = path.read_bytes()
    length = struct.unpack_from("<I", data, 12)[0]
    document = json.loads(data[20:20+length])
    removed = 0
    for mesh in document.get("meshes", []):
        for primitive in mesh["primitives"]:
            material = document.get("materials", [])[primitive["material"]]
            if "normalTexture" not in material and "TANGENT" in primitive["attributes"]:
                del primitive["attributes"]["TANGENT"]
                removed += 1
    encoded = json.dumps(document, separators=(",", ":")).encode()
    encoded += b" "*((-len(encoded)) % 4)
    remaining = data[20+length:]
    header = struct.pack("<4sIIII", b"glTF", 2, 20+len(encoded)+len(remaining), len(encoded), 0x4E4F534A)
    path.write_bytes(header+encoded+remaining)
    return removed


def export_candidate(stage, details, *, source=SOURCE, candidate=CANDIDATE, evidence=EVIDENCE):
    """只发布通过模型契约检查的候选，并保留每阶段的精简报告。"""
    import bpy
    config = json.loads((ROOT / "src/data/character-scene.json").read_text())
    # 1. 排除编辑源中的预览相机及灯具，保留原履历相机与焦点。
    bpy.ops.object.select_all(action="DESELECT")
    exported = []
    for obj in bpy.context.scene.objects:
        selected = obj.type == "MESH" or obj.name == "ResumeCamera" or obj.name.startswith("focus-")
        obj.select_set(selected)
        if selected:
            exported.append(obj.name)
    bpy.context.scene.frame_set(0)
    temporary = candidate.with_name(f".{candidate.stem}-pending.glb")
    bpy.ops.export_scene.gltf(filepath=str(temporary), export_format="GLB", use_selection=True,
        export_cameras=True, export_lights=False, export_animations=True, export_force_sampling=True,
        export_frame_range=True, export_frame_step=1, export_tangents=True, export_extras=True,
        export_copyright="3D base generated with Meshy (CC BY 4.0), customized for Hou")
    details["unusedTangentBindingsRemoved"] = strip_unused_tangents(temporary)
    # 2. 官方结构检查和交互契约都通过，才以原子重命名更新候选。
    checked = subprocess.run(["node", "scripts/validate-character-model.mjs", str(temporary),
        "--stage=ready", f"--resume-count={len(config['resume'])}"], cwd=ROOT, capture_output=True, text=True)
    if checked.returncode:
        raise RuntimeError(f"候选校验失败，保留上一候选：{checked.stdout[:1800]} {checked.stderr[:300]}")
    report = json.loads(checked.stdout)
    temporary.replace(candidate)
    bpy.context.scene.camera = bpy.data.objects["ResumeCamera"]
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(evidence / "hou-quality-candidate.blend"))
    report.update(stage=stage, sourceSha256=sha256(source), details=details, exported=exported)
    (evidence / f"{stage}-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps({key: report[key] for key in ["stage", "bytes", "sha256", "counts", "structural", "details"]}, ensure_ascii=False))


def main():
    """从固定第一版累计执行指定精修阶段，每轮运行互不叠加形变。"""
    import bpy
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", choices=STAGES, default="final")
    args = parser.parse_args()
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    details = {"browStitch": stitch_brow_patch(), "sideHairStitch": stitch_side_hair_patch(), "skin": refine_skin()}
    if STAGES.index(args.stage) >= 1:
        details["eyes"] = refine_eyes()
    if STAGES.index(args.stage) >= 2:
        details["hair"] = refine_hair()
    details["generationSeconds"] = round(time.monotonic()-start, 2)
    export_candidate(args.stage, details)


if __name__ == "__main__":
    main()
