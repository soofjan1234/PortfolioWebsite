# 人物基础模型来源

- 制作服务：Meshy 网页版，Meshy 6 Lite。
- 造型参考：[用户确认的黑发正面图 v5](../character-front-v5-unified.png)。
- 灰模由用户导出提供，原文件名 `Meshy_AI_Bright_Eyed_Smile_1004072447_generate.glb`，已复制保存为 [hou-base-v1.glb](hou-base-v1.glb)。
- 彩色模型通过当前灰模的 Texture / Image Input 入口，使用对应参考图生成 PBR 贴图；本轮消耗 10 点，余额由 110 变为 100。用户完成下载，原文件名 `Meshy_AI_Bright_Eyed_Smile_1004073422_texture.glb`，保存为 [hou-textured-v1.glb](hou-textured-v1.glb)。
- 当前许可：Meshy 免费模型 CC BY 4.0，使用时保留 Meshy 署名。网站上线时应在素材说明中注明 `3D base model generated with Meshy (CC BY 4.0), customized for Hou`。
- 生成参数：High Detail、Pose 关闭；纹理生成开启 Generate PBR Maps。此处记录浏览器实际可见参数，未确认的内部参数不作推测。

## 当前验证结果

| 文件 | 字节数 | 顶点 | 三角形 | 材质 | 纹理 | 相机/动画 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| hou-base-v1.glb | 4,320,268 | 119,927 | 240,030 | 0 | 0 | 0 / 0 |
| hou-textured-v1.glb | 12,420,788 | 137,051 | 240,030 | 1 | 3 | 0 / 0 |

彩色版的 Khronos 校验错误数为 0，警告数为 1；全部纹理内嵌，无外部资源依赖。它仍是一个整体网格，尚无独立眼球和相机动画，不能作为完成交互契约的成品。

- 灰模 SHA-256：`49e901a2601c5a57f8dc1887811c794c7b6cbdc3c5b49d1887352b1c74c7b692`
- 彩色版 SHA-256：`ec33a1844ac67d0de5490d14c9a6f50c70dc26b1aa46dfa8fa51d8063489bbfe`
- [灰模结构报告](base-report.json)、[彩色版结构报告](textured-base-report.json)、[网页彩色预览](meshy-textured-v1.jpg)。

官方说明：[免费计划](https://help.meshy.ai/en/articles/15696428-what-is-included-on-the-free-plan)、[GLB 与纹理导出](https://help.meshy.ai/en/articles/15724161-how-to-export-meshy-models-with-colors-and-textures)。

## 第一版交互精修

使用官方 Blender Python 模块 `bpy==4.5.14` 精修，不再消耗 Meshy 点数。脚本拆分头部、衣服、头发、镜框，移除旧眼睛表面并建立完整的独立眼球；按统一的两项履历配置导出 24 fps、0–200 帧的相机动画与五个焦点。

- 第一版备份：[baseline.glb](quality-refinement/baseline.glb)，7,287,648 字节，79,506 三角形，结构校验 0 错误、0 警告。
- 编辑源：[hou-scene-v1.blend](hou-scene-v1.blend)。
- 生成脚本：[prepare-character-scene.py](../../../../../scripts/prepare-character-scene.py)。
- SHA-256：`201ed284f620168eea57346660116adfd9b07440edf29786e468d60c22d33534`。
- [精修报告](preparation-report.json)、[交互结构报告](prepared-ready-report.json)、[资产验收报告](asset-verification.json)。

macOS 当前环境的复现命令：

```sh
uv venv --python 3.11 .codex-model-tools
uv pip install --python .codex-model-tools/bin/python bpy==4.5.14
.codex-model-tools/bin/python scripts/prepare-character-scene.py
node scripts/validate-character-model.mjs public/models/me.glb --stage=ready --resume-count=2
```

命令在仓库根目录执行。生成器保留原始灰模和彩色 GLB；精修结果是交互初稿，外观与正式网页效果的验收进度以主题状态表为准。

此前第二版候选已按用户要求删除；第一版备份与原始素材继续保留。

## 当前正式模型

本轮直接使用第一版编辑源，未调用新的三维生成服务。皮肤、衣服与镜框拆为独立材质；皮肤和头发的程序材质通过 Blender 烘焙为 GLB 内嵌贴图。虹膜纹理、眼睑过渡带、头发 UV 与局部形体调整由 [精修脚本](../../../../../scripts/refine-character-quality.py) 生成。

2026-10-04 用户确认模型收尾，已验收版本发布为 [正式 GLB](../../../../../public/models/me.glb)：9,764,808 字节、81,244 三角形，SHA-256 为 `c2147c0a767a131d2a652a2bd399aeaa1afc9f68902739353439848d5f0a464e`。交付检查 0 错误、0 警告，见 [交付报告](quality-refinement/accepted-report.json)。许可与 Meshy 署名要求沿用上述记录。

运行 `.codex-model-tools/bin/python scripts/refine-character-quality.py --stage=final` 可重新生成 [精修副本](../../../../../public/models/me-quality-candidate.glb) 与 [可编辑源](quality-refinement/hou-quality-candidate.blend)，不会覆盖正式文件。第一版生成命令会覆盖正式路径，仅在明确需要恢复第一版时执行。具体参数见 [最终阶段报告](quality-refinement/final-report.json)，验证证据见 [验收记录](quality-refinement/verification.md)。
