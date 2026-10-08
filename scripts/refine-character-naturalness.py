"""从已验收编辑源制作眼睛、材质自然质感候选；正式模型不作为输出。"""
import importlib.util
from pathlib import Path
import numpy as np

# 本轮复用已验收的接缝与 UV 修复，只修改候选副本。
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/changes/2026-10-04-character-resume/assets/model/quality-refinement/hou-quality-candidate.blend'
EVIDENCE = SOURCE.parent.parent / 'natural-refinement'
CANDIDATE = ROOT / 'public/models/me-natural-candidate.glb'
SPEC = importlib.util.spec_from_file_location('quality', Path(__file__).with_name('refine-character-quality.py'))
quality = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(quality)
# 米制几何：保留外圈，外表面与眼球至少间隔 3mm，内封边埋入 3mm。
EYE_CLEARANCE = .003
LID_ROUNDNESS = .002


def skin_roughness(roughness, mask):
    """仅改变皮肤遮罩内的光泽，非皮肤像素保留原值。"""
    weight = np.clip(mask, 0, 1)
    adjusted = np.clip(np.asarray(roughness)*.84+.02, .40, .78)
    return np.asarray(roughness)*(1-weight)+adjusted*weight


def eyelid_surface(outer, inner, center, radius):
    """保留头部交界，生成圆顺过渡带与更自然的上下眼睑开口。"""
    outer, inner, center = np.asarray(outer), np.asarray(inner).copy(), np.asarray(center)
    count = len(outer)
    if count < 8 or inner.shape != outer.shape:
        raise ValueError('眼睑边界缺失或形状不一致')
    # 1. 仅整理内圈；固定外圈避免破坏此前已验收的头部交界及 UV。
    for _ in range(4):
        inner = .55*inner+.225*np.roll(inner, 1, axis=0)+.225*np.roll(inner, -1, axis=0)
    midpoint = (inner[:, [0, 2]].min(axis=0)+inner[:, [0, 2]].max(axis=0))*.5
    inner[:, 0] = midpoint[0]+(inner[:, 0]-midpoint[0])*.99
    vertical = inner[:, 2]-midpoint[1]
    inner[:, 2] = midpoint[1]+vertical*np.where(vertical > 0, .80, .88)
    # 2. 外表面按球面包络投影，过渡带带轻微弧度，使高光连续。
    rings = [outer.copy()]
    for progress in [.25, .5, .75, 1.]:
        ring = outer*(1-progress)+inner*progress
        radial = (ring[:, 0]-center[0])**2+(ring[:, 2]-center[2])**2
        depth = center[1]-np.sqrt(np.maximum(0, (radius+EYE_CLEARANCE)**2-radial))
        ring[:, 1] = np.minimum(ring[:, 1], depth)-LID_ROUNDNESS*np.sin(np.pi*progress)
        rings.append(ring)
    contact = rings[-1]-center
    rings.append(center+contact*((radius-EYE_CLEARANCE)/np.linalg.norm(contact, axis=1))[:, None])
    faces = [(ring*count+i, ring*count+(i+1)%count, (ring+1)*count+(i+1)%count, (ring+1)*count+i)
             for ring in range(len(rings)-1) for i in range(count)]
    contacts = [False]*((len(rings)-2)*count)+[True]*count
    return np.concatenate(rings), faces, contacts


def image_pixels(image):
    """批量读取图像像素，避免逐像素访问 Blender API。"""
    values = np.empty(image.size[0]*image.size[1]*4, dtype=np.float32)
    image.pixels.foreach_get(values)
    return values.reshape(image.size[1], image.size[0], 4)


def replace_roughness(material, name, adjust):
    """生成独立粗糙度贴图，保留原图及所有底色贴图。"""
    import bpy
    shader = material.node_tree.nodes.get('Principled BSDF')
    original = shader.inputs['Roughness'].links[0].from_node.image
    pixels = image_pixels(original)
    pixels[:, :, :3] = adjust(pixels[:, :, :3])
    image = bpy.data.images.new(name, width=original.size[0], height=original.size[1], alpha=True)
    image.colorspace_settings.name = 'Non-Color'
    image.pixels.foreach_set(pixels.reshape(-1))
    image.pack()
    texture = material.node_tree.nodes.new('ShaderNodeTexImage')
    texture.image = image
    material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Roughness'])
    return {'image': name, 'range': [float(pixels[:, :, 0].min()), float(pixels[:, :, 0].max())]}


def refine_eyelids():
    """只替换独立眼睑网格，眼球、头部与材质归属保持原状。"""
    import bpy
    import bmesh
    results = []
    for side in ['left', 'right']:
        eye, lid = bpy.data.objects[f'eye-{side}'], bpy.data.objects[f'eyelid-{side}']
        old = lid.data
        positions = np.array([vertex.co[:] for vertex in old.vertices])
        count = len(positions)//4
        if count*4 != len(positions):
            raise ValueError('已验收眼睑不是四圈拓扑，拒绝猜测修改')
        points, faces, contacts = eyelid_surface(positions[:count], positions[2*count:3*count], np.array(eye.location), eye.dimensions.x/2)
        mesh = bpy.data.meshes.new(f'NaturalLid-{side}')
        mesh.from_pydata(points.tolist(), [], faces)
        mesh.update()
        for material in old.materials:
            mesh.materials.append(material)
        for face in mesh.polygons:
            face.use_smooth = True
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        if sum(face.normal.y for face in bm.faces) > 0:
            bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
        bm.to_mesh(mesh)
        bm.free()
        attribute = mesh.attributes.new('EyeContact', type='BOOLEAN', domain='FACE')
        attribute.data.foreach_set('value', contacts)
        lid.data = mesh
        shader = mesh.materials[0].node_tree.nodes.get('Principled BSDF')
        shader.inputs['Roughness'].default_value = .56
        results.append({'side': side, 'outerVertices': count, 'vertices': len(points), 'faces': len(faces), 'maxOuterDifference': float(np.abs(points[:count]-positions[:count]).max())})
    return results


def refine_materials():
    """保留现有底色，通过区域保护和分部位光泽减少塑料感。"""
    import bpy
    # 1. 眼白、虹膜及瞳孔共用湿润表面响应，不改变网格、UV 或眼球朝向。
    for side in ['left', 'right']:
        for material, roughness in zip(bpy.data.objects[f'eye-{side}'].data.materials, [.22, .15, .10]):
            shader = material.node_tree.nodes.get('Principled BSDF')
            shader.inputs['Roughness'].default_value = roughness
            shader.inputs['Specular IOR Level'].default_value = .5
            shader.inputs['Coat Weight'].default_value = .85
            shader.inputs['Coat Roughness'].default_value = .055
    # 2. 皮肤只调整遮罩内的粗糙度，嘴唇、牙齿、眉毛的底色和几何保持不变。
    mask = image_pixels(bpy.data.images['skin-mask'])[:, :, :1]
    skin = replace_roughness(bpy.data.objects['character-head'].data.materials[0], 'natural-skin-roughness', lambda values: skin_roughness(values, mask))
    # 3. 头发保留发束纹理，但让柔和主光能够表现连续高光。
    hair_material = bpy.data.objects['character-hair'].data.materials[0]
    hair = replace_roughness(hair_material, 'natural-hair-roughness', lambda values: np.clip(values*.60+.10, .42, .64))
    hair_material.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = .42
    # 4. 镜框采用较硬的反射，与皮肤和头发拉开材质差异。
    frames = bpy.data.objects['character-glasses'].data.materials[0].node_tree.nodes['Principled BSDF']
    frames.inputs['Roughness'].default_value = .28
    frames.inputs['Coat Weight'].default_value = .15
    frames.inputs['Coat Roughness'].default_value = .12
    return {'skin': skin, 'hair': hair}


def main():
    """每次从固定已验收源生成独立候选，避免反复叠加修型。"""
    import bpy
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    details = {'eyelids': refine_eyelids(), 'materials': refine_materials()}
    quality.export_candidate('natural', details, source=SOURCE, candidate=CANDIDATE, evidence=EVIDENCE)


if __name__ == '__main__':
    main()
