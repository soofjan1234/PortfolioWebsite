# 人物正面参考图 v5 提示词

用户确认继续简化头发：黑色、侧扫刘海、轻微蓬松；减少独立发块和细碎纹理，以连续体积与少量方向凹槽表现发型，避免头盔感。脸、眼镜、表情和衣服保持。

使用内置 ImageGen，在黑发 v4 的基础上进行两次局部编辑，第一轮简化不足，第二轮加强连续形体和大面积平滑表面。保存最终选图为 [character-front-v5-unified.png](character-front-v5-unified.png)。新图待用户视觉验收，旧版本保留。

## 最终提示词

```text
Use case: precise-object-edit.
Localized edit: REPLACE THE ENTIRE HAIR REGION with a substantially simpler sculpted animation-character haircut. Leave every non-hair pixel and feature as close to the input as possible: exact same face, eyes, eyebrows, ears, nose, glasses, smile, skin, ivory shirt, background, lighting, camera and framing.

The current image still has many separate textured hair locks and thousands of visible fine hair strands. The required change must be obvious: simplify the hair substantially into ONE COHESIVE, CONTINUOUS, SMOOTHLY SCULPTED BLACK HAIRSTYLE. Treat it as carefully modeled solid 3D geometry, rather than groomed hair fibers. No visible individual hair fibers anywhere. No fuzzy or brushed surface texture.

Shape: youthful short side-swept haircut, slightly lifted crown, compact tapered temples, softly asymmetrical silhouette. One connected mass of hair throughout the crown and sides. Across the large swept front area, use only THREE very broad flowing, shallow sculptural ridges, with wide smooth surfaces and softly blended transitions. These ridges belong to the same connected surface, not separate strands or objects. A few subtle, thin, shallow curved grooves may describe overall direction; no repeated deep divisions. The fringe forms a unified gently swept tapered edge with two or three small natural notches. Keep the forehead and eyebrows visible.

Material: matte near-black sculpted surface with broad soft charcoal shading, clean and quiet, like simplified hair on a high-quality animated character maquette. Use soft studio highlights to communicate the connected volume. Completely remove all tiny striations, strand-level grain, repetitive fine lines, fibers, flyaways and dense roughness noise. Preserve a natural overall haircut silhouette so it does not resemble a rigid helmet.

Keep the character's recognizable identity and approved face unchanged. The simplification is confined to hair only. No new objects, stickers, words, logos or watermark.
```
