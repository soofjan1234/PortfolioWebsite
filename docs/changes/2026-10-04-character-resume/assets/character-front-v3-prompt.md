# 人物正面参考图 v3 提示词

用户认可 v2 的脸、眼镜、表情和衣服，要求修改头发。本次使用内置 ImageGen 对 v2 局部编辑：自然棕色短发、侧扫刘海、扁平发束和柔和层次，减少粗卷块；其余视觉元素保持。

输出：[character-front-v3.png](character-front-v3.png)。本图是建模参考图片；新版发型待用户视觉验收。

## 最终提示词

```text
Use case: precise-object-edit.
Edit target: the supplied front-facing 3D cartoon character portrait.
Primary request: CHANGE ONLY THE HAIR. Keep the exact same face, face proportions, large eyes, eyebrows, nose, ears, skin, black rectangular glasses, asymmetric friendly toothy smile, neck, ivory crewneck clothing, head angle, camera, crop, lighting and off-white background. The user approved all of these and disliked only the current hair.
Replace the current thick curled tube-like sculpted locks with an attractive natural-looking stylized SHORT BROWN HAIRCUT. A modern slightly tousled side-swept haircut for a young adult man, compact flattering silhouette, softly lifted crown with moderate volume, neatly tapered sides around the temples and ears, and light layered bangs swept across the top of the forehead. Make the hair read as one cohesive softly sculpted hairstyle with flowing broad shallow overlapping planar locks and fine restrained directional grooves. Locks should be thinner, flatter, softly tapered, and integrated into the overall hair mass, resembling stylized animation-film hair rather than a pile of separate objects. Preserve a rich medium chestnut brown color with gentle tonal variation, smooth clean surface and soft studio highlights. Keep eyebrows fully visible and minimize overlap with eyeglass frames.
Avoid chunky cylindrical strands, coils, sausages, ropes, dreadlocks, big separate curled blobs, clay poop-like shapes, wood grain, hairy felt texture, spiky hedgehog silhouette, excessive volume, long hair and dense individual flyaway strands.
Strict constraints: hair-only localized edit. Do not redesign any facial feature or change the expression. Single character, same front portrait, no text, no stickers, no logos, no watermark.
```
