# 人物 3D 主页改版状态

原模型已验收；手机工具栏稳定性与履历近景已获用户 iPhone 认可。2026-10-08 新增眼睛、材质及灯光的自然质感候选，52 项前端、20 项 Python、10 项模型契约测试和两项构建通过，候选结构 0 错误/0 警告，等待用户外观验收。交付包含手机修复与独立质感候选，正式模型保留原版。

## 设计

| 设计文档 | 状态 | 主要结论 | 更新日期 |
| --- | --- | --- | --- |
| design.md | 已确认 | 人物主页方案保留；追加手机工具栏稳定性及教育、工作段脸颊近景，正文避开黑发并减弱磨砂。 | 2026-10-08 |
| design/character-quality.md | 已确认 | 基于已验收源制作独立自然质感候选，调整眼睑、材质与灯光，保护眼球变换、相机和嘴部。 | 2026-10-08 |

## 计划

| 计划文档 | 状态 | 完成结果 | 下一步 | 更新日期 |
| --- | --- | --- | --- | --- |
| plan.md | 待验证 | 手机工具栏稳定性和脸颊近景通过 48 项测试及生产构建；两段近景、反向回顶及高度变化已检查，用户 iPhone 视觉验收通过。 | 其他真机、横竖屏视觉和长时性能仍待验证。最新证据见 home-verification.md。 | 2026-10-08 |
| plan/character-quality.md | 已完成 | 用户确认收尾；已验收版本替换正式 GLB，默认预览沿用精修灯光。最新模型的 15 项精修测试、10 项模型测试通过，交付结构校验 0 错误、0 警告。 | 作为主页场景资产使用；网页阶段验证完整滚动、加载失败与移动端降级。 | 2026-10-04 |
| plan/character-naturalness.md | 待验证 | 自然质感候选已生成；自动检查、两项构建、同镜头对照和目光检查通过。证据见 assets/model/natural-refinement/verification.md。 | 用户外观验收；认可后再替换正式模型和默认灯光。 | 2026-10-08 |

## 正式模型

自然质感候选入口：http://127.0.0.1:5174/?quality=natural；同布光对照追加 `&lighting=baseline`。独立资产为 `public/models/me-natural-candidate.glb`，完整证据见 [候选验收记录](assets/model/natural-refinement/verification.md)。普通入口仍使用下方正式模型。

- 文件：[public/models/me.glb](../../../public/models/me.glb)，9,764,808 字节，81,244 三角形。SHA-256：c2147c0a767a131d2a652a2bd399aeaa1afc9f68902739353439848d5f0a464e。
- 默认入口：[正式模型预览](http://127.0.0.1:5173/docs/changes/2026-10-04-character-resume/assets/model/preview.html)；[正式预览截图](assets/model/quality-refinement/accepted-preview.jpg)、[交付报告](assets/model/quality-refinement/accepted-report.json)。
- 复现：[精修脚本](../../../scripts/refine-character-quality.py) 从第一版编辑源生成精修副本；[已验收编辑源](assets/model/quality-refinement/hou-quality-candidate.blend) 可继续编辑。生成副本不会自动覆盖正式模型。
- 保留：[第一版备份](assets/model/quality-refinement/baseline.glb)、[第一版编辑源](assets/model/hou-scene-v1.blend) 和原始 Meshy 素材。来源、许可与复现注意事项见 [source.md](assets/model/source.md)。
- 契约：两只完整眼球各自围绕球心转动，默认各外偏 0.12 rad；CameraAction 与五个焦点匹配 [统一履历配置](../../../src/data/character-scene.json)，24 fps、0–200 帧。兼容性比较见 [记录](assets/model/quality-refinement/compatibility.json)。

## 验证与边界

最近追加的脖子黑三角、侧发白片、眼角白块及眼周色差均有原因、回归检查和浏览器前后证据，集中保存在 [验收记录](assets/model/quality-refinement/verification.md)。模型验收完成不代表主页改造完成，也不宣称与参考图完全相同。

模型预览及历史主页构图证据保存在 `assets/home-reference/`。当前用户已在 iPhone 本地版确认工具栏收放无闪动，履历近景清楚且构图合适；其余真机、横竖屏视觉与长时性能仍待验证。

## 主页入口与交付

主页已在现有 React/Vite 工程内实现固定人物场景、统一履历锚点和相机/焦点映射，后接横向 Tech Hub 与作品。模型失败或减少动态效果时使用透明静态人物，HTML 内容和链接继续可用。三类文章复用现有 Markdown，原 /projects 与 /experience 可访问。本地预览端口以开发服务输出为准；生产验收使用忽略目录 `.codex-home-dist`，线上更新以托管发布结果为准。
