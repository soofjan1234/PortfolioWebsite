"""验证精修的区域保护、输入拒绝及眼窝边界，不以测试代替美术验收。"""
import importlib.util
import math
from pathlib import Path
import unittest

import numpy as np

# 通过文件路径导入，命令行脚本保留与项目已有脚本一致的连字符命名。
SPEC = importlib.util.spec_from_file_location("character_quality", Path(__file__).with_name("refine-character-quality.py"))
quality = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(quality)


class QualityTests(unittest.TestCase):
    """覆盖会污染无关区域或破坏模型的边界行为。"""

    def test_baked_outer_eye_corner_matches_adjacent_skin(self):
        """射线定位到头部贴图的旧眼白；修复后须接近邻近皮肤，不能留下白色楔形。"""
        import bpy
        bpy.ops.wm.open_mainfile(filepath=str(quality.EVIDENCE / "hou-quality-candidate.blend"))
        image = bpy.data.images["skin-basecolor"]
        width, height = image.size
        pixels = np.array(image.pixels[:]).reshape(height, width, 4)
        def sample(uv):
            return pixels[int(uv[1]*height), int(uv[0]*width), :3]
        adjacent = sample((.74553049, .58695257))
        for uv in [(.74271476, .59400189), (.74258482, .58943099)]:
            self.assertLess(np.max(np.abs(sample(uv)-adjacent)), .08)
        # 相邻健康皮肤不应因清除旧眼白而被整体重涂。
        np.testing.assert_allclose(adjacent, [.8941, .5686, .4275], atol=.015)

    def test_eyelid_skin_chroma_matches_surrounding_skin(self):
        """眼睑不能使用比周围皮肤明显偏灰的固定修补色。"""
        import bpy
        bpy.ops.wm.open_mainfile(filepath=str(quality.EVIDENCE / "hou-quality-candidate.blend"))
        surrounding_srgb = np.array([.89, .56, .435])
        surrounding_linear = ((surrounding_srgb+.055)/1.055)**2.4
        for side in ["left", "right"]:
            material = bpy.data.objects[f"eyelid-{side}"].data.materials[0]
            color = np.array(material.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value[:3])
            np.testing.assert_allclose(color/color[0], surrounding_linear/surrounding_linear[0], atol=.045)

    def test_brow_fragment_is_stitched_without_open_edges(self):
        """误分到头发的眉部碎片应与皮肤共边，不能留下独立的材质和法线接缝。"""
        import bpy
        bpy.ops.wm.open_mainfile(filepath=str(quality.SOURCE))
        result = quality.stitch_brow_patch()
        self.assertGreater(result["stitchedFaces"], 0)
        self.assertEqual(result["openPatchEdges"], 0)
        self.assertGreater(result["splitHeadEdges"], 0)
        self.assertGreater(result["fringe"]["stitchedFaces"], 0)
        self.assertEqual(result["fringe"]["openPatchEdges"], 0)
        self.assertIsNotNone(bpy.data.objects["character-head"].data.uv_layers.active)

    def test_restored_brow_uv_does_not_paint_the_neck(self):
        """眉部 UV 不能跨贴图岛形成长三角，覆盖脖子的正常采样区域。"""
        import bpy
        bpy.ops.wm.open_mainfile(filepath=str(quality.SOURCE))
        quality.stitch_brow_patch()
        mesh = bpy.data.objects["character-head"].data
        mesh.calc_loop_triangles()
        uv = np.array([loop.uv[:] for loop in mesh.uv_layers.active.data])
        for target in [np.array([.059898097, .884365559]), np.array([.060175344, .882928252])]:
            hits = []
            for tri in mesh.loop_triangles:
                a, b, c = uv[list(tri.loops)]
                matrix = np.column_stack((b-a, c-a))
                if abs(np.linalg.det(matrix)) < 1e-12:
                    continue
                s, t = np.linalg.solve(matrix, target-a)
                if s >= 0 and t >= 0 and s+t <= 1:
                    hits.append(np.mean([mesh.vertices[v].co.z for v in tri.vertices]))
            self.assertEqual(len(hits), 1, f"脖子 UV 被其他部位覆盖：{hits}")
            self.assertLess(hits[0], -.35)

    def test_side_hair_fragment_is_stitched_into_hair(self):
        """头发侧面的浅色孤片须接回头发，转移后不留下裂口。"""
        import bpy
        bpy.ops.wm.open_mainfile(filepath=str(quality.SOURCE))
        result = quality.stitch_side_hair_patch()
        self.assertEqual(result["stitchedFaces"], 106)
        self.assertEqual(result["openPatchEdges"], 0)
        head = bpy.data.objects["character-head"]
        self.assertFalse(any(v.co.x < -.37 and .176 < v.co.y < .248 and .519 < v.co.z < .594 for v in head.data.vertices))

    def test_baked_neck_retains_skin_color(self):
        """直接检查最终贴图的黑三角原位置，防止结构正确但烘焙仍受污染。"""
        import bpy
        bpy.ops.wm.open_mainfile(filepath=str(quality.EVIDENCE / "hou-quality-candidate.blend"))
        image = bpy.data.images["skin-basecolor"]
        width, height = image.size
        pixels = np.array(image.pixels[:]).reshape(height, width, 4)
        for u, v in [(.059898097, .884365559), (.060175344, .882928252)]:
            color = pixels[int(v*height), int(u*width), :3]
            np.testing.assert_allclose(color, [.915, .59, .435], atol=.045)

    def test_eyelids_clear_the_rotating_eye_surface(self):
        """眼睑外表面避开球面，内封边遮住透视缝隙；二者职责须分别检查。"""
        import bpy
        from mathutils.geometry import closest_point_on_tri
        bpy.ops.wm.open_mainfile(filepath=str(quality.SOURCE))
        head = bpy.data.objects["character-head"]
        checked = 0
        for edges in quality.boundary_components(head.data):
            indexes = {index for edge in edges for index in edge}
            center = np.mean([head.data.vertices[index].co[:] for index in indexes], axis=0)
            if not (80 < len(edges) < 250 and center[1] < -.2 and .25 < center[2] < .42):
                continue
            side = "left" if center[0] < 0 else "right"
            eye = bpy.data.objects[f"eye-{side}"]
            result = quality.build_eyelid(head, edges, eye)
            mesh = bpy.data.objects[result["name"]].data
            mesh.calc_loop_triangles()
            self.assertEqual(sum(tri.normal.y > 0 for tri in mesh.loop_triangles), 0,
                             f"{side} 眼睑存在折向背面的三角面")
            if side == "right":
                # 近景中该像素曾穿过眼角看到后脑头发，封边后必须先命中眼睑。
                from mathutils import Vector
                from mathutils.bvhtree import BVHTree
                tree = BVHTree.FromPolygons([v.co for v in mesh.vertices],
                                           [t.vertices[:] for t in mesh.loop_triangles], all_triangles=True)
                forward = Vector((0, 2.05, -.03)).normalized()
                up = Vector((0, .03, 2.05)).normalized()
                origin = Vector((0, 0, .32))-forward*1.2
                direction = (forward+Vector((1, 0, 0))*((886.5/1280*2-1)*1280/720*math.tan(math.radians(18)))
                             +up*((1-375.5/720*2)*math.tan(math.radians(18)))).normalized()
                point, _, _, distance = tree.ray_cast(origin, direction)
                self.assertIsNotNone(point, "右眼外侧仍有能看到后脑的缝隙")
                self.assertLess(distance, 1.1)
            exterior = [tri for tri in mesh.loop_triangles
                        if not mesh.attributes["EyeContact"].data[tri.polygon_index].value]
            clearance = min((closest_point_on_tri(eye.location, *[mesh.vertices[i].co for i in tri.vertices])
                             - eye.location).length-eye.dimensions.x/2 for tri in exterior)
            self.assertGreaterEqual(clearance, .001, f"{side} 眼睑穿入眼球：{clearance}")
            # 原眼窝也要留出间隙；只修新增过渡带仍会使头部三角面穿过眼白。
            head.data.calc_loop_triangles()
            for tri in head.data.loop_triangles:
                vertices = [head.data.vertices[i].co for i in tri.vertices]
                if any(vertex.y >= eye.location.y for vertex in vertices):
                    continue
                distance = (closest_point_on_tri(eye.location, *vertices)-eye.location).length
                self.assertGreaterEqual(distance-eye.dimensions.x/2, .001)
            checked += 1
        self.assertEqual(checked, 2)

    def test_skin_mask_protects_teeth_eyebrows_and_mouth(self):
        """同一位置的白牙、黑眉及口腔深色必须不参与肤色变化。"""
        colors = np.array([[.78, .58, .43], [.92, .91, .87], [.04, .035, .03], [.15, .05, .04]])
        positions = np.tile([.2, -.28, .16], (4, 1))
        weights = quality.skin_weights(colors, positions)
        self.assertGreater(weights[0], .8)
        np.testing.assert_array_equal(weights[1:], 0)

    def test_skin_mask_does_not_tint_shirt_fragments(self):
        """头部网格里残留的下方衣服不能被误认为皮肤。"""
        result = quality.skin_weights(np.array([[.78, .58, .43]]), np.array([[.5, .3, -.8]]))
        self.assertEqual(result[0], 0)

    def test_warm_nose_is_skin_but_red_lip_is_protected(self):
        """相同暖红底色须结合部位判断，鼻尖不能被当作嘴唇排除。"""
        colors = np.array([[.7, .34, .25], [.7, .34, .25]])
        positions = np.array([[0, -.42, .18], [0, -.32, -.02]])
        result = quality.skin_weights(colors, positions)
        self.assertGreater(result[0], .8)
        self.assertEqual(result[1], 0)

    def test_invalid_uv_fails_before_sampling(self):
        """越界、空数组和非有限贴图坐标需要显式失败。"""
        for uv in [np.array([[np.nan, .5]]), np.array([[1.2, .5]]), np.empty((0, 2))]:
            with self.assertRaises(ValueError):
                quality.validate_uv(uv)

    def test_removing_bake_attributes_preserves_uv(self):
        """Blender 删除属性会使旧句柄失效，清理遮罩不能误删 UV。"""
        import bpy
        mesh = bpy.data.meshes.new("QualityAttributeFixture")
        try:
            mesh.from_pydata([(0, 0, 0), (1, 0, 0), (0, 1, 0)], [], [(0, 1, 2)])
            mesh.uv_layers.new(name="UVMap")
            for name in ["QualitySkinMask", "QualityBlush", "QualityRoughness"]:
                mesh.color_attributes.new(name=name, type="FLOAT_COLOR", domain="CORNER")
            quality.remove_bake_attributes(mesh)
            self.assertEqual(list(mesh.uv_layers.keys()), ["UVMap"])
            self.assertEqual(len(mesh.color_attributes), 0)
        finally:
            bpy.data.meshes.remove(mesh)

    def test_closed_boundary_can_be_ordered_without_losing_vertices(self):
        """打乱边的输入仍可还原闭环，供眼睑过渡面使用。"""
        loop = quality.order_boundary([(2, 3), (0, 1), (3, 0), (1, 2)])
        self.assertEqual(set(loop), {0, 1, 2, 3})
        self.assertEqual(len(loop), 4)

    def test_replacing_eye_materials_preserves_iris_and_pupil_regions(self):
        """换材质后原有虹膜和瞳孔面仍属于原材质槽。"""
        import bpy
        mesh = bpy.data.meshes.new("EyeMaterialFixture")
        materials = [bpy.data.materials.new(f"EyeFixture-{i}") for i in range(3)]
        try:
            mesh.from_pydata([(0, 0, 0), (1, 0, 0), (0, 1, 0)], [], [(0, 1, 2)])
            for material in materials:
                mesh.materials.append(material)
            mesh.polygons[0].material_index = 2
            quality.replace_materials(mesh, materials)
            self.assertEqual(mesh.polygons[0].material_index, 2)
        finally:
            bpy.data.meshes.remove(mesh)
            for material in materials:
                bpy.data.materials.remove(material)

    def test_open_or_disconnected_boundary_is_rejected(self):
        """裂口、分叉及两个独立闭环不能当作一只眼窝。"""
        for edges in [[(0, 1), (1, 2)], [(0, 1), (1, 2), (2, 0), (1, 3)],
                      [(0, 1), (1, 2), (2, 0), (3, 4), (4, 5), (5, 3)]]:
            with self.assertRaises(ValueError):
                quality.order_boundary(edges)


if __name__ == "__main__":
    unittest.main()
