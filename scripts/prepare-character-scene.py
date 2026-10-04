"""用 Blender 4.5 精修自己的基础模型，生成网页场景与可编辑源文件。

运行：.codex-model-tools/bin/python scripts/prepare-character-scene.py
输入、履历顺序和导出位置固定在主题计划中；原始 GLB 始终保留。
"""
import json
import math
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# Blender 内部为 Z 轴向上、人物正面朝 -Y；导出器负责转换为 glTF 的 Y 轴向上。
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs/changes/2026-10-04-character-resume/assets/model"
CONFIG = ROOT / "src/data/character-scene.json"
SOURCE = ASSETS / "hou-textured-v1.glb"
OUTPUT = ROOT / "public/models/me.glb"


def point_at(obj, target):
    """让相机和灯光朝向目标；导出相机以本地 -Z 作为观察方向。"""
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def material(name, color, roughness=0.5):
    """创建可由 glTF 原生 PBR 表达的哑光材质。"""
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    return result


def sample_regions(obj):
    """根据几何中心和内嵌底色定位衣服、头发、眼镜及眼白。"""
    # 1. 三角形纹理中心用于判断区域，完整 UV 仍由复制的原网格保留。
    mesh = obj.data
    centers = np.array([face.center[:] for face in mesh.polygons])
    shader = mesh.materials[0].node_tree.nodes.get("Principled BSDF")
    base_image = shader.inputs["Base Color"].links[0].from_node.image
    width, height = base_image.size
    pixels = np.array(base_image.pixels[:], dtype=np.float32).reshape(height, width, 4)
    uv = np.array([mesh.uv_layers.active.data[loop].uv[:] for face in mesh.polygons for loop in face.loop_indices]).reshape(-1, 3, 2).mean(axis=1)
    colors = pixels[(uv[:, 1]*height).astype(int).clip(0, height-1), (uv[:, 0]*width).astype(int).clip(0, width-1), :3]
    x, y, z = centers.T
    dark = colors.max(axis=1) < .30
    hair = dark & ((z > .51) | ((y > -.17) & (z > -.24)) | ((np.abs(x) > .29) & (z > .05)))
    glasses = (colors.max(axis=1) < .50) & (y < -.32) & (z > .205) & (z < .434) & ~hair
    shirt = (z < -.42) & (colors[:, 2] > colors[:, 0]*.86)
    eye_area = (y < -.235) & (z > .23) & (z < .4) & (np.abs(x) > .035) & (np.abs(x) < .24)
    white = eye_area & (colors.min(axis=1) > .68) & (colors.max(axis=1)-colors.min(axis=1) < .20)
    # 2. 用眼白的空间轮廓建立眼窝开口，同时移除里面的旧瞳孔。
    eyes = []
    eye_cut = np.zeros(len(centers), dtype=bool)
    for name, side in [("eye-left", x < 0), ("eye-right", x > 0)]:
        points = centers[white & side]
        if len(points) < 100:
            raise ValueError(f"{name} 的眼白采样不足，停止导出以免切错脸部")
        fit = np.linalg.lstsq(np.column_stack((2*points, np.ones(len(points)))), (points*points).sum(axis=1), rcond=None)[0]
        center = fit[:3]
        radius = math.sqrt(fit[3] + (center*center).sum())
        if not .075 < radius < .15:
            raise ValueError(f"{name} 的拟合半径异常：{radius}")
        outline = convex_hull(points[:, [0, 2]])
        inside = inside_outline(centers[:, [0, 2]], outline)
        # 黑色瞳孔不能被误认成镜框；眼白轮廓内部统一归眼窝。
        glasses &= ~inside
        eye_cut |= inside & (y < -.22) & ~hair
        eyes.append((name, center, radius))
    head = ~(hair | glasses | shirt | eye_cut)
    return {"character-head": head, "character-shirt": shirt, "character-hair": hair, "character-glasses": glasses}, eyes


def convex_hull(points):
    """获得眼白投影的凸包；不使用矩形遮罩切掉眼角之外的脸部。"""
    ordered = sorted(set(tuple(point) for point in points))

    def cross(a, b, c):
        """判断连续边的转向，保持凸包逆时针。"""
        return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])

    lower, upper = [], []
    for sequence, hull in [(ordered, lower), (list(reversed(ordered)), upper)]:
        for point in sequence:
            while len(hull) > 1 and cross(hull[-2], hull[-1], point) <= 0:
                hull.pop()
            hull.append(point)
    return np.array(lower[:-1] + upper[:-1])


def inside_outline(points, outline):
    """筛选凸包内部的面中心，限定眼窝切除边界。"""
    mask = np.ones(len(points), dtype=bool)
    for index, start in enumerate(outline):
        end = outline[(index+1) % len(outline)]
        cross = (end[0]-start[0])*(points[:, 1]-start[1]) - (end[1]-start[1])*(points[:, 0]-start[0])
        mask &= cross >= -0.00003
    return mask


def extract_object(source, name, mask):
    """拆出原始几何并保留 UV；各对象独立存在，旋转眼球不会拖动头部。"""
    obj = source.copy()
    obj.data = source.data.copy()
    obj.name = name
    bpy.context.scene.collection.objects.link(obj)
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    mesh.faces.ensure_lookup_table()
    bmesh.ops.delete(mesh, geom=[face for face in mesh.faces if not mask[face.index]], context="FACES")
    bmesh.ops.delete(mesh, geom=[vertex for vertex in mesh.verts if not vertex.link_faces], context="VERTS")
    # UV 接缝处的重复顶点焊接为同一形体，UV 本身保存在各个面角上。
    bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=0.000015)
    mesh.to_mesh(obj.data)
    mesh.free()
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def apply_modifier(obj, modifier):
    """在明确的活动对象上应用修改器，避免上下文依赖选错对象。"""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def refine_hair(obj):
    """降低细碎凹槽，以连续黑色体积呈现发型，同时保持脸部接缝。"""
    # 1. 生成模型没有独立头皮，保留与脸部接缝的位置以免露出空洞。
    boundary = set()
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    for edge in mesh.edges:
        if edge.is_boundary:
            boundary.update(vertex.index for vertex in edge.verts)
    mesh.free()
    interior = obj.vertex_groups.new(name="HairInterior")
    interior.add([vertex.index for vertex in obj.data.vertices if vertex.index not in boundary], 1, "REPLACE")
    # 2. 仅平滑内部曲面，让尖细发束融入主要形体；边界保持接合。
    smooth = obj.modifiers.new("UnifiedHair", "SMOOTH")
    smooth.factor = .75
    smooth.iterations = 40
    smooth.vertex_group = interior.name
    apply_modifier(obj, smooth)
    decimate = obj.modifiers.new("HairBudget", "DECIMATE")
    decimate.ratio = .17
    apply_modifier(obj, decimate)
    obj.data.materials.clear()
    obj.data.materials.append(material("HairGraphite", (.012, .015, .019), .62))
    # 纯色头发无需 UV 和法线贴图；去掉退化 UV，避免生成零长度切线。
    for layer in list(obj.data.uv_layers):
        obj.data.uv_layers.remove(layer)
    for face in obj.data.polygons:
        face.material_index = 0


def build_eye(name, center, radius, materials):
    """建立有完整背面的独立球体，局部原点固定在拟合得到的眼球中心。"""
    # 极轴朝前，虹膜边缘落在完整纬线上，避免按普通球体面心涂色的锯齿。
    angles = sorted(set([index*math.pi/48 for index in range(1, 48)] + [.265, .365]))
    segments = 96
    vertices = [(0, -radius, 0)]
    for angle in angles:
        for index in range(segments):
            phi = index*2*math.pi/segments
            vertices.append((radius*math.sin(angle)*math.cos(phi), -radius*math.cos(angle), radius*math.sin(angle)*math.sin(phi)))
    vertices.append((0, radius, 0))
    faces, slots = [], []
    for index in range(segments):
        faces.append((0, 1+(index+1)%segments, 1+index))
        slots.append(2)
    for ring in range(len(angles)-1):
        slot = 2 if angles[ring+1] <= .265 else 1 if angles[ring+1] <= .365 else 0
        for index in range(segments):
            a = 1+ring*segments+index
            b = 1+ring*segments+(index+1)%segments
            c = b+segments
            d = a+segments
            faces.append((a, b, c, d))
            slots.append(slot)
    for index in range(segments):
        a = 1+(len(angles)-1)*segments+index
        b = 1+(len(angles)-1)*segments+(index+1)%segments
        faces.append((a, b, len(vertices)-1))
        slots.append(0)
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], [tuple(reversed(face)) for face in faces])
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = center
    # 基础模型的眼窝略向上倾，默认目光抬起 8 度，避免瞳孔被下眼睑遮住。
    obj.rotation_euler.x = math.radians(-8)
    for entry in materials:
        obj.data.materials.append(entry)
    # 虹膜与瞳孔位于球面上，跟随同一网格转动，不设置容易拖动眼镜的子节点。
    for face, slot in zip(obj.data.polygons, slots):
        face.material_index = slot
        face.use_smooth = True
    obj["pivot_contract"] = "局部原点为眼球中心；-Y 为正前方"
    return obj


def build_camera(config):
    """按统一履历顺序创建焦点和 24 fps 相机轨道。"""
    names = [config["startFocus"], *[entry["focus"] for entry in config["resume"]], config["worksFocus"], config["techHubFocus"]]
    if len(config["resume"]) != 2:
        raise ValueError("新增履历时须同时设计镜头；当前镜头方案仅对应两项已确认内容")
    # 焦点和相机均为 Blender 坐标；帧位置由统一配置计算。
    targets = [(0, 0, .05), (-.10, -.16, .32), (.11, -.12, .30), (0, 0, -.12), (0, 0, .05)]
    positions = [(0, -3.3, .17), (-.72, -1.75, .49), (.72, -1.72, .28), (-.65, -2.35, -.04), (.25, -3.3, .22)]
    data = bpy.data.cameras.new("ResumeCamera")
    data.lens = 35
    data.sensor_fit = "VERTICAL"
    camera = bpy.data.objects.new("ResumeCamera", data)
    bpy.context.scene.collection.objects.link(camera)
    bpy.context.scene.camera = camera
    camera.rotation_mode = "QUATERNION"
    for index, (name, target, position) in enumerate(zip(names, targets, positions)):
        focus = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(focus)
        focus.location = target
        focus.empty_display_size = .04
        frame = index * config["framesPerEntry"]
        camera.location = position
        camera.rotation_quaternion = (Vector(target)-camera.location).to_track_quat("-Z", "Y")
        camera.keyframe_insert("location", frame=frame)
        camera.keyframe_insert("rotation_quaternion", frame=frame)
    camera.animation_data.action.name = "CameraAction"
    for curve in camera.animation_data.action.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = "BEZIER"
            point.handle_left_type = "AUTO_CLAMPED"
            point.handle_right_type = "AUTO_CLAMPED"
    scene = bpy.context.scene
    scene.render.fps = config["fps"]
    scene.frame_start = 0
    scene.frame_end = (len(names)-1)*config["framesPerEntry"]
    scene.frame_set(0)
    return camera


def setup_preview():
    """建立用于验收的柔光环境；网页灯光由前端控制，不导出预览灯具。"""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 32
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.world = bpy.data.worlds.new("PreviewWorld")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.8, .78, .74, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = .45
    for name, position, energy, size in [("PreviewKey", (-3, -4, 4), 300, 4), ("PreviewFill", (3, -2, 2), 150, 3), ("PreviewRim", (0, 2, 3), 250, 3)]:
        light = bpy.data.lights.new(name, "AREA")
        light.energy, light.size = energy, size
        obj = bpy.data.objects.new(name, light)
        scene.collection.objects.link(obj)
        obj.location = position
        point_at(obj, (0, 0, .1))
    data = bpy.data.cameras.new("PreviewCamera")
    data.type = "ORTHO"
    data.ortho_scale = 2.25
    camera = bpy.data.objects.new("PreviewCamera", data)
    scene.collection.objects.link(camera)
    return camera


def render_preview(camera, name, position, target=(0, 0, .05)):
    """保存实际模型检查图，明确相机视角与眼球姿态。"""
    scene = bpy.context.scene
    scene.camera = camera
    camera.location = position
    point_at(camera, target)
    scene.render.filepath = str(ASSETS / f"prepared-{name}.png")
    bpy.ops.render.render(write_still=True)


def main():
    """保留输入、精修结构、导出成品并保存可重复的验收证据。"""
    # 1. 配置和模型先检查，导入后才清理当前临时 Blender 场景。
    config = json.loads(CONFIG.read_text())
    if not SOURCE.is_file():
        raise FileNotFoundError(SOURCE)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    source = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
    masks, eye_specs = sample_regions(source)
    pieces = {name: extract_object(source, name, mask) for name, mask in masks.items()}
    bpy.data.objects.remove(source, do_unlink=True)
    refine_hair(pieces["character-hair"])
    for name, ratio in [("character-head", .45), ("character-shirt", .30), ("character-glasses", .70)]:
        modifier = pieces[name].modifiers.new("WebBudget", "DECIMATE")
        modifier.ratio = ratio
        apply_modifier(pieces[name], modifier)
    eye_materials = [material("Sclera", (.88, .9, .85), .32), material("Iris", (.034, .046, .035), .4), material("Pupil", (.004, .007, .006), .22)]
    eyes = [build_eye(name, center, radius, eye_materials) for name, center, radius in eye_specs]
    camera = build_camera(config)
    # 2. 网页仅导出模型、焦点与相机；切线用于原始法线贴图的一致渲染。
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format="GLB", use_selection=True, export_cameras=True, export_lights=False, export_animations=True, export_force_sampling=True, export_frame_range=True, export_frame_step=1, export_tangents=True, export_extras=True, export_copyright="3D base generated with Meshy (CC BY 4.0), customized for Hou")
    # 3. 保存可编辑源与真实眼球转动效果，再恢复初始姿态。
    preview = setup_preview()
    bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "hou-scene-v1.blend"))
    render_preview(preview, "front", (0, -5, .05))
    render_preview(preview, "side", (5, -.05, .05))
    render_preview(preview, "back", (0, 5, .05))
    for eye in eyes:
        eye.rotation_euler = (math.radians(-12), 0, math.radians(14))
    render_preview(preview, "look-right", (0, -5, .05))
    for eye in eyes:
        eye.rotation_euler = (math.radians(-8), 0, 0)
    bpy.context.scene.camera = camera
    bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "hou-scene-v1.blend"))
    summary = {"source": SOURCE.name, "output": str(OUTPUT.relative_to(ROOT)), "resumeCount": len(config["resume"]), "eyes": [{"name": name, "center": center.tolist(), "radius": radius} for name, center, radius in eye_specs], "meshes": [{"name": obj.name, "vertices": len(obj.data.vertices), "faces": len(obj.data.polygons)} for obj in [*pieces.values(), *eyes]], "fps": config["fps"], "frames": [0, bpy.context.scene.frame_end]}
    (ASSETS / "preparation-report.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
