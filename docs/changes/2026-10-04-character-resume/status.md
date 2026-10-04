# 人物 3D 主页改版状态

模型阶段已完成。主页首帧与响应式修复保留，导航、回顶及左右翻页已统一对齐；36 项测试、生产构建和桌面/窄屏交互验证通过。当前证据见 home-verification.md；用户已认可当前效果并授权提交推送，真机验证仍待进行。

## 设计

| 设计文档 | 状态 | 主要结论 | 更新日期 |
| --- | --- | --- | --- |
| design.md | 已确认 | 自己的 3D 人物首屏，滚动运镜展示履历，随后进入横向 Tech Hub 和作品；保留现有文章入口与路由。 | 2026-10-04 |
| design/character-quality.md | 已确认 | 人物精修及追加瑕疵修复已验收，后续沿用本版身份、材质和交互契约。 | 2026-10-04 |

## 计划

| 计划文档 | 状态 | 完成结果 | 下一步 | 更新日期 |
| --- | --- | --- | --- | --- |
| plan.md | 待验证 | 首帧与响应式修复保留；导航下移 20px，回顶按钮按阈值出现、到顶隐藏，适配减少动态效果并恢复键盘焦点。36 项测试、构建及桌面/320px 布局和回顶操作验证通过。 | 用户已认可并授权提交推送；真实 iOS/Android 性能与兼容性验证仍待进行。最新证据见 home-verification.md 与 assets/home-fixes/。 | 2026-10-04 |
| plan/character-quality.md | 已完成 | 用户确认收尾；已验收版本替换正式 GLB，默认预览沿用精修灯光。最新模型的 15 项精修测试、10 项模型测试通过，交付结构校验 0 错误、0 警告。 | 作为主页场景资产使用；网页阶段验证完整滚动、加载失败与移动端降级。 | 2026-10-04 |

## 正式模型

- 文件：[public/models/me.glb](../../../public/models/me.glb)，9,764,808 字节，81,244 三角形。SHA-256：c2147c0a767a131d2a652a2bd399aeaa1afc9f68902739353439848d5f0a464e。
- 默认入口：[正式模型预览](http://127.0.0.1:5173/docs/changes/2026-10-04-character-resume/assets/model/preview.html)；[正式预览截图](assets/model/quality-refinement/accepted-preview.jpg)、[交付报告](assets/model/quality-refinement/accepted-report.json)。
- 复现：[精修脚本](../../../scripts/refine-character-quality.py) 从第一版编辑源生成精修副本；[已验收编辑源](assets/model/quality-refinement/hou-quality-candidate.blend) 可继续编辑。生成副本不会自动覆盖正式模型。
- 保留：[第一版备份](assets/model/quality-refinement/baseline.glb)、[第一版编辑源](assets/model/hou-scene-v1.blend) 和原始 Meshy 素材。来源、许可与复现注意事项见 [source.md](assets/model/source.md)。
- 契约：两只完整眼球各自围绕球心转动，默认各外偏 0.12 rad；CameraAction 与五个焦点匹配 [统一履历配置](../../../src/data/character-scene.json)，24 fps、0–200 帧。兼容性比较见 [记录](assets/model/quality-refinement/compatibility.json)。

## 验证与边界

最近追加的脖子黑三角、侧发白片、眼角白块及眼周色差均有原因、回归检查和浏览器前后证据，集中保存在 [验收记录](assets/model/quality-refinement/verification.md)。模型验收完成不代表主页改造完成，也不宣称与参考图完全相同。

模型预览已检查正侧背面、眉眼特写、目光跟随、相机首尾和反向返回。本轮参考站构图、桌面浏览与手机横竖屏视口模拟已复验，最新证据在 `assets/home-reference/`；真实手机性能与兼容性、用户视觉认可仍待验证。

## 主页入口与交付

主页已在现有 React/Vite 工程内实现固定人物场景、统一履历锚点和相机/焦点映射，后接横向 Tech Hub 与作品。模型失败或减少动态效果时使用透明静态人物，HTML 内容和链接继续可用。三类文章复用现有 Markdown，原 /projects 与 /experience 可访问。开发预览为 http://localhost:5173/；生产验收使用忽略目录 `.codex-home-dist`，未推送或部署。
