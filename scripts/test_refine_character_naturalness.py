"""验证自然质感候选保护已验收几何、眼球与非皮肤区域。"""
import importlib.util
from pathlib import Path
import unittest
import json
import struct
import hashlib
import numpy as np

SPEC = importlib.util.spec_from_file_location('naturalness', Path(__file__).with_name('refine-character-naturalness.py'))
natural = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(natural)


class NaturalnessTests(unittest.TestCase):
    """只验证约束与保护边界，视觉好坏交由同镜头对照。"""

    def test_non_skin_roughness_is_unchanged(self):
        """嘴唇、牙齿和其他非皮肤像素不能随皮肤光泽一起修改。"""
        rough = np.array([.25, .65, .9])
        result = natural.skin_roughness(rough, np.array([0., 1., 0.]))
        np.testing.assert_array_equal(result[[0, 2]], rough[[0, 2]])
        self.assertLess(result[1], rough[1])

    def test_eyelid_preserves_outer_boundary_and_closes_inside_eye(self):
        """外圈保持原值，内封边位于眼球内部，外侧过渡带保持安全间隙。"""
        center = np.zeros(3)
        radius = .114
        angle = np.linspace(0, 2*np.pi, 80, endpoint=False)
        outer = np.column_stack([.095*np.cos(angle), np.full(80, -.1), .06*np.sin(angle)])
        inner = outer.copy()
        inner[:, [0, 2]] *= .9
        points, faces, contacts = natural.eyelid_surface(outer, inner, center, radius)
        np.testing.assert_array_equal(points[:80], outer)
        count = len(points)//80
        self.assertEqual(len(faces), len(contacts))
        self.assertTrue(all(contacts[-80:]))
        self.assertTrue(np.all(np.linalg.norm(points[-80:], axis=1) < radius))
        self.assertTrue(np.all(np.linalg.norm(points[80:(count-1)*80], axis=1) >= radius+.0029))

    def test_eyelid_opening_remains_large_but_softens_vertical_shape(self):
        """只收整上下眼睑，不改变大眼睛的整体身份特征。"""
        angle = np.linspace(0, 2*np.pi, 80, endpoint=False)
        outer = np.column_stack([.095*np.cos(angle), np.full(80, -.1), .06*np.sin(angle)])
        inner = outer.copy()
        inner[:, [0, 2]] *= .9
        points, _, _ = natural.eyelid_surface(outer, inner, np.zeros(3), .114)
        opening = points[-160:-80]
        self.assertGreater(np.ptp(opening[:, 0]), np.ptp(inner[:, 0])*.95)
        self.assertLess(np.ptp(opening[:, 2]), np.ptp(inner[:, 2])*.95)
        self.assertGreater(np.ptp(opening[:, 2]), np.ptp(inner[:, 2])*.7)

    def test_candidate_exports_eye_coating_and_preserves_interaction(self):
        """真实导出须包含眼球清漆，节点变换和全部动画轨道仍与正式版一致。"""
        def load(path):
            data = path.read_bytes()
            length = struct.unpack_from('<I', data, 12)[0]
            return json.loads(data[20:20+length]), data[28+length:]
        baseline, baseline_bin = load(natural.ROOT / 'public/models/me.glb')
        candidate, candidate_bin = load(natural.CANDIDATE)
        before = {node.get('name'): node for node in baseline['nodes']}
        after = {node.get('name'): node for node in candidate['nodes']}
        for name, node in before.items():
            for field in ['translation', 'rotation', 'scale', 'matrix']:
                np.testing.assert_allclose(after[name].get(field, []), node.get(field, []), atol=1e-6, err_msg=name)
        for document, buffer in [(baseline, baseline_bin), (candidate, candidate_bin)]:
            tracks = []
            for animation in document['animations']:
                for sampler in animation['samplers']:
                    for key in ['input', 'output']:
                        accessor = document['accessors'][sampler[key]]
                        view = document['bufferViews'][accessor['bufferView']]
                        start = view.get('byteOffset', 0)
                        tracks.append(hashlib.sha256(buffer[start:start+view['byteLength']]).hexdigest())
            if document is baseline:
                original_tracks = tracks
            else:
                self.assertEqual(tracks, original_tracks)
        eye_materials = [material for material in candidate['materials'] if material.get('name', '').startswith(('Sclera', 'Iris', 'Pupil'))]
        self.assertEqual(len(eye_materials), 6)
        for material in eye_materials:
            coat = material.get('extensions', {}).get('KHR_materials_clearcoat', {})
            self.assertGreater(coat.get('clearcoatFactor', 0), .8)
            self.assertLess(material['pbrMetallicRoughness']['roughnessFactor'], .25)

    def test_candidate_preserves_non_eyelid_geometry_and_skin_base_color(self):
        """读取真实编辑源，确认嘴部和其他非眼睑网格未被候选修型污染。"""
        import bpy
        bpy.ops.wm.open_mainfile(filepath=str(natural.SOURCE))
        geometry = {obj.name: np.array([vertex.co[:] for vertex in obj.data.vertices]) for obj in bpy.data.objects if obj.type == 'MESH' and not obj.name.startswith('eyelid-')}
        skin_color = natural.image_pixels(bpy.data.images['skin-basecolor'])
        bpy.ops.wm.open_mainfile(filepath=str(natural.EVIDENCE / 'hou-quality-candidate.blend'))
        for name, vertices in geometry.items():
            np.testing.assert_array_equal(np.array([vertex.co[:] for vertex in bpy.data.objects[name].data.vertices]), vertices, err_msg=name)
        np.testing.assert_array_equal(natural.image_pixels(bpy.data.images['skin-basecolor']), skin_color)


if __name__ == '__main__':
    unittest.main()
