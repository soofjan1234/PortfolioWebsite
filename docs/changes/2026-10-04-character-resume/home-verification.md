# 主页改造验收记录

## 当前：导航、回顶与翻页对齐（2026-10-04）

用户确认后，按钮组在桌面与手机均下移 20px。桌面按钮 top=38px，边框 top=24px；手机按钮 top=37px，边框 top=16px。首页超过 120px 显示圆形回顶按钮，返回 0px 后隐藏；点击关闭菜单并将焦点交回菜单按钮，减少动态效果时立即返回。最新按用户要求将左右翻页与导航统一为圆形 34px、间距 16px；桌面右侧预留 216px，手机为 208px。桌面与 320px 窄屏实测同排垂直差小于 0.2px，页面无横向溢出，窄屏点击下一组后横向偏移为 278px。

验证：新增测试先出现 3 项预期失败，目标测试全部通过；最终 `npm test` 为 4 个文件、29 项通过，生产构建退出码 0。浏览器实际点击与 Enter 回顶均返回 `top=0`、恢复菜单焦点并隐藏按钮；桌面 Tech Hub 和手机作品栏目都已检查。证据：[导航测量](assets/home-fixes/navigation-checks.json)、[顶部间距](assets/home-fixes/navigation-desktop-top.jpg)、[桌面三个按钮](assets/home-fixes/navigation-desktop-scrolled.jpg)、[手机三个按钮](assets/home-fixes/navigation-mobile-scrolled.jpg)。本轮复用既有主页设计，未修改模型与内容。

对齐调整后重新运行全部 29 项测试与生产构建，均通过。最新样式证据：[按钮测量](assets/home-fixes/controls-alignment.json)、[桌面对齐](assets/home-fixes/controls-aligned-desktop.jpg)、[手机对齐](assets/home-fixes/controls-aligned-mobile.jpg)。

## 首帧与响应式修复（2026-10-04）

用户确认三项修复方案后完成以下验证，范围与契约见 [设计](design.md)。本轮未改动正式 GLB。

| 问题与原因 | 修复与当前证据 |
| --- | --- |
| 首页人物先悬浮再落位：ready 发生在绘制前，相机从导出姿态阻尼靠近首页落点；静态图仍为旧构图。 | 首帧直接使用当前目标姿态，绘制成功后发布 ready，后续输入继续阻尼。桌面刷新连续 35 次采样只有 loading 和固定 `0.0000,0.2500,3.3000` 的 ready；窄屏落点为 `0.0000,0.3882,3.7997`。重新生成两种透明静态图并按高度缩放，503 降级时与正常首屏的构图一致。 |
| 844×390 联系弹窗高约 696px，关闭按钮落在视口外。 | 窗口限制在视口内、内容独立滚动、关闭按钮固定保留；低视口横屏二维码与说明并排。当前窗口 top≈20px、bottom≈370px，二维码和关闭按钮完整可见，关闭成功。 |
| 320px Tech Hub 标题折行，文章库入口与导航挤在一起。 | 窄屏标题和操作区参与正常布局并分行；标题 top≈80px、操作区 top≈129px，顶部导航 bottom=51px。标题保持单行，页面宽度与视口内容区均为 314px，没有横向溢出。 |
| 相关功能回归 | 生产页面桌面作品前后按钮、文章弹窗和手机分类键盘访问通过；八类列表为 17/15/9/8/6/3/2/3，共 63 个链接。Escape 恢复分类焦点与背景滚动。正常页面控制台警告与错误为 0。 |

验证过程：新增相机组件测试最初 4 项按预期失败；修复后目标测试通过。最终 `npm test` 为 4 个文件、25 项通过；`npm run build -- --outDir .codex-home-dist` 退出码 0。构建保留既有大分包与 Browserslist 提示。本轮浏览操作使用 Codex 浏览器工具，未运行 `test:browser` 自动脚本，也未宣称真实手机性能已测。

证据：[浏览记录](assets/home-fixes/browser-checks.json)、[制品数量与哈希](assets/home-fixes/artifact-manifest.json)、[桌面首屏](assets/home-fixes/desktop-hero.jpg)、[手机首屏](assets/home-fixes/mobile-hero.jpg)、[320px Tech Hub](assets/home-fixes/tech-hub-320.jpg)、[横屏联系窗口](assets/home-fixes/contact-landscape.jpg)、[桌面降级](assets/home-fixes/desktop-fallback.jpg)、[手机降级](assets/home-fixes/mobile-fallback.jpg)。静态导出脚本现生成桌面与窄屏两份图；本轮通过临时本地导出页复用正式 CharacterScene，在首帧绘制后读取透明画布生成制品，脚本另做语法检查。

以下为本轮修复之前的构图改造与首轮功能记录，仅作历史证据。

2026-10-04，按用户要求重新对照 About Sen：全屏绿色人物背景、下方居中简介、右侧磨砂时间轴，以及从右侧进入的深色全高作品展板。人物与内容保留自己的身份；正式 GLB 未改变。首轮左右分栏和浅色卡片没有通过用户视觉验收，其功能结果仅作归档。

## 历史：参考站构图修正

| 验证 | 最新证据 |
| --- | --- |
| 前端测试 | `npm test`：3 个文件、20 项通过。新增两端 35% 镜头停顿和首屏/磨砂/压暗反向恢复检查。 |
| 构建 | `npm run build -- --outDir .codex-home-dist` 退出码 0；入口 231.43 KB，gzip 77.09 KB；三维与文章仍按需加载。 |
| 模型 | 就绪契约通过，0 错误、0 警告；SHA-256 与已验收正式模型一致，无首个差异。网页额外挂载四个原创 GZU / BUILD / Go / NAS 贴纸，不改写模型文件。 |
| 桌面构图 | 同尺寸对照参考站首屏、履历特写和作品入场；人物覆盖视口，简介居中，右侧文字配磨砂。作品首段透明空白纳入横向距离，展板从右侧进入，末尾可正常离开。 |
| 手机 | 390×844、844×390 视口模拟；页面无横向溢出，原生横滑及文章弹窗可用，关闭景深与目光跟随。横屏简介底部 319.5px，小于 390px 视口高度。 |
| 文章与焦点 | 八类文章数量 17 / 15 / 9 / 8 / 6 / 3 / 2 / 3，共 63 个入口；Escape 关闭后回到原分类按钮。修正鼠标聚焦移动卡片导致末张卡片点击失效的问题，自动推进只用于键盘焦点。 |
| 失败恢复 | 本地代理使模型和 Go 文章返回 503：静态人物、错误提示、重试及原文章页入口均可用；模型失败后其他分类仍读出 3 个链接。文章请求重试成功由当前 Vitest 覆盖。 |
| 兼容入口 | 原 `/projects`、`/experience` 可访问并返回主页，只有一个场景画布；二维码加载成功，联系窗口可以关闭。正常生产页控制台错误 0。 |

最新截图与浏览记录保存在 `assets/home-reference/`：

- [桌面首屏](assets/home-reference/desktop-hero.jpg)、[履历](assets/home-reference/desktop-resume.jpg)、[作品入场](assets/home-reference/desktop-works-entry.jpg)、[Tech Hub](assets/home-reference/desktop-tech-hub.jpg)。
- [手机首屏](assets/home-reference/mobile-hero.jpg)、[手机横屏](assets/home-reference/mobile-landscape.jpg)、[手机作品](assets/home-reference/mobile-works.jpg)、[手机文章](assets/home-reference/mobile-articles.jpg)。
- [模型失败](assets/home-reference/model-failure.jpg)、[文章失败](assets/home-reference/article-failure.jpg)、[降级后文章可读](assets/home-reference/model-failure-readable.jpg)。
- [本轮浏览记录](assets/home-reference/manual-browser-checks.json)、[截图清单与哈希](assets/home-reference/artifact-manifest.json)。本轮通过 Codex 浏览器工具完成界面操作及 DOM 核对，没有把首轮 19 项自动浏览检查当作新结果。

`scripts/check-home-browser.mjs` 已适配参考站构图与相机阻尼，增加布局检查并等待镜头停稳；本轮只对该脚本做语法检查。减少动态效果由当前 Vitest 覆盖，完整 WebGL/超时分支自动浏览结果保留在首轮归档。真实 iOS/Android 设备性能和用户最终视觉认可仍待验证。

标题字体从 [Google Fonts 官方 Mansalva 目录](https://github.com/google/fonts/tree/main/ofl/mansalva) 获取，OFL 文件保存于 `public/fonts/Mansalva-OFL.txt`。场景 MIT 和 Meshy / CC BY 4.0 署名继续保留。

## 首轮功能结果（视觉未通过，保留归档）

| 验证 | 实际结果 |
| --- | --- |
| 前端 Vitest | 3 个文件、18 项通过：滚动帧与焦点、正反向横轨、触屏/减少动态效果、文章失败与重试、主页降级、导航与联系窗口焦点。 |
| 模型契约测试 | 10 项通过；正式 GLB 就绪校验 0 错误、0 警告，五个焦点匹配两项履历。 |
| 生产构建 | 退出码 0。文章页和三维按需拆包，主页入口 JavaScript 约 231.16 KB，gzip 约 76.95 KB。Three 和原文章渲染包仍有大分包提示，不视为构建失败。 |
| 浏览器验收 | 19 项通过，未处理脚本错误 0；八类 Markdown 共解析并访问 63 篇文章入口。 |
| 设备布局 | 1440×1000 桌面、1280×720 桌面、390×844 和 320×740 手机，以及对应手机横屏；页面无横向溢出。 |
| 降级 | 模型下载失败、解析失败、18 秒超时、WebGL 初始化失败、上下文丢失、场景模块失败均使用静态人物，文章仍可打开。减少动态效果不请求 GLB；运行中切换偏好可以清理并恢复场景。 |
| 完整浏览 | 首屏→两项履历→作品→Tech Hub→联系；横向轨道正向到尾、正常离开、反向返回；四项作品入口、邮件协议、微信窗口、原 `/projects` 与 `/experience` 入口通过。 |

镜头停靠使用正文顶部到达视口 30% 的位置；相机和景深读取同一份帧与焦点状态，逆向浏览恢复同一位置。桌面横轨使用页面纵向距离推动原生 `scrollLeft`，不拦截滚轮；按钮和键盘焦点同步滚动位置。

## 首轮证据

- [浏览器报告](assets/home/browser-checks.json)、[制品清单与 SHA-256](assets/home/artifact-manifest.json)。共 37 张关键截图，保存在 `assets/home/`，包括首屏、履历、各横向栏目首尾、手机横竖屏及全部降级分支。
- [桌面首屏](assets/home/desktop-hero.png)、[教育镜头](assets/home/desktop-education.png)、[工作镜头](assets/home/desktop-work.png)、[作品](assets/home/desktop-works-start.png)、[Tech Hub](assets/home/desktop-tech-hub-start.png)。
- [手机首屏](assets/home/mobile-hero.png)、[手机 Tech Hub](assets/home/mobile-tech-hub.png)、[320px 首屏](assets/home/small-mobile-hero.png)、[减少动态效果](assets/home/reduced-motion.png)、[模型超时](assets/home/model-timeout.png)。
- 正式 GLB 本轮未修改，首个差异为无；9,764,808 字节，SHA-256：`c2147c0a767a131d2a652a2bd399aeaa1afc9f68902739353439848d5f0a464e`。
- 静态人物直接从正式场景画布导出，保留透明背景；385,961 字节，SHA-256：`0193edf84f2ab96cffb99d2a1577aa5bd69b0d456ba3f5581c2e1ada2a45b4d4`。导出脚本为 `scripts/capture-character-static.mjs`。
- 场景参考站的 MIT 许可保存在 `public/scene-source-license.txt`；主页末尾保留 Sen 与 Meshy / CC BY 4.0 署名。

## 复现

在仓库根目录执行；浏览器脚本默认使用本机 Google Chrome。未安装 Chrome 时，可安装 Playwright 的 Chromium，并以 `PORTFOLIO_BROWSER_CHANNEL=chromium` 运行。

```sh
npm run test
node --test scripts/validate-character-model.test.mjs
node scripts/validate-character-model.mjs public/models/me.glb --stage=ready --resume-count=2
npm run build -- --outDir .codex-home-dist
npm run preview -- --outDir .codex-home-dist --port 4173
```

预览服务运行后，在另一终端执行 `npm run test:browser`。修正后的脚本将证据输出到 `assets/home-reference/`；首轮证据保留在 `assets/home/`。静态图可在开发服务运行时用 `npm run character:static` 重导出。`.codex-home-dist` 属于忽略目录，未覆盖仓库里原有的 `dist` 制品，也未推送或部署。

## 验证过程与边界

编码前新增滚动和阅读测试，观察到纯函数缺失、旧首页没有文章按钮和降级提示的预期 RED；实现后达到目标 GREEN，最终完成相关全量。浏览器验收修正了两项实际显示问题：景深 shader 强制不透明黑底，以及履历锚点位于 section 顶部造成的文字与镜头偏移。验收脚本也补足截图绘制等待和二维码图片加载等待，避免把加载中的瞬间当作结果。

当前主题状态为「待验证」，余项为真机浏览器、真实设备帧率与最终人工视觉验收。本地结果不代表已测真实手机，也不代表线上部署完成。

## 文章顺序与分类（2026-10-04）

已按确认方案调整为履历 → Tech Hub → Selected Works → 联系。首页与 /projects 共用 Go、MySQL、Redis 三类及聚合读取逻辑，八个原始 Markdown 来源保留。内容测试核对 Go 39 / MySQL 15 / Redis 9，共 63 个唯一链接。未逐一访问外部文章站点。

RED：新顺序测试在旧实现上失败；目标 GREEN：Home 7 项通过；最终 npm test 共 33 项通过，生产构建成功，git diff --check 无错误。已有 bundle 大小与 Browserslist 数据陈旧提示仍存在。

浏览器验证：桌面菜单跳转 Tech Hub、横移、打开 Go 列表显示 39 篇，再跳转 Works，DOM 位置确认文章在前；390px 窄屏按钮排列正常，Redis 列表显示 9 篇；/projects Classic 仅显示同样三个分类。截图：[Go 聚合](assets/home-fixes/article-category-go.jpg)、[窄屏分类](assets/home-fixes/article-category-mobile.jpg)。真实手机测试仍待进行。

## Redis 标识与掘金入口修正（2026-10-04）

Redis 卡片大字显示完整 Redis；首页“完整文章库”使用用户提供的 https://juejin.cn/user/4074147977125020/posts，新标签页打开并设置 noopener noreferrer。独立 /projects 路由继续保留。新增测试先验证旧链接失败，修正后 Home 9 项、相关全量 35 项测试通过，生产构建成功。本轮未验证掘金外站可用性。

## 项目清单更新（2026-10-04）

按用户要求移除首页内容创作助手，新增 agent-playbook、mini-k8s、Feed 并置于原有三项之前。介绍及链接依据三个 GitHub 仓库 README；新增项目使用名称封面，图片为可选字段，项目总数从数据计算。旧本地素材未删除。

RED：清单和数量两项断言失败；目标 Home 10 项通过；最终全量 36 项测试通过，生产构建成功。浏览器确认六项及正确仓库地址，桌面截图见 [项目更新](assets/home-fixes/projects-updated.jpg)。

## 雾蓝·暖银试用（2026-10-04）

完成首页背景、文字、导航、卡片、弹窗、强调色和页脚的配色替换。36 项测试通过，生产构建成功；桌面首屏/项目区及 390px 文章区已目视检查。截图：[首屏](assets/home-fixes/mist-blue-hero.jpg)、[项目区](assets/home-fixes/mist-blue-works.jpg)。仅配色调整，不新增颜色常量断言。

## 燕麦·暖白（2026-10-04）

针对暗色反馈，已将卡片、背景、弹窗及页脚整体改为浅色，文字调整为深灰棕；构建成功，浏览器目视检查首屏和项目区。截图：[首屏](assets/home-fixes/oat-hero.jpg)、[项目](assets/home-fixes/oat-works.jpg)。本轮为配色修改，未新增行为测试。

## 履历文字对比度修正（2026-10-04）

用户截图显示文字与人物头发、眼镜重叠，仅加深编号不足以解决。两段履历增加 96% 不透明的暖白阅读底层，正文、日期、副标题及标签使用实色深棕，保留现有滚动锚点与布局尺寸。生产构建通过，浏览器检查教育段覆盖人物区域时仍清晰可读；截图见 assets/home-fixes/resume-contrast.jpg。

## 履历柔光试用（2026-10-04）

用户否决实心阅读卡片后，按确认方案移除其边框、圆角及阴影；改用径向暖白渐变和模糊边缘，保留深棕正文。构建通过，桌面教育段目视确认无矩形边界。当前预览：assets/home-fixes/resume-soft-glow.jpg；取代上一版 resume-contrast.jpg，等待用户视觉认可。

## 履历加粗版本（2026-10-04）

用户否决柔光，按要求移除局部渐变底层，恢复透明背景。两段履历正文、日期及标签为 600 字重，标题和编号为 700；标签取消填充。浏览器检查教育段并保存 assets/home-fixes/resume-bold.jpg，取代柔光试用效果；差异空白检查通过。本次只调整 CSS，未重跑行为测试。

## 02 工作经历文案更新（2026-10-04）

依据 interview-guide/Guide/content/项目 下文档中心、相册、MediaAI、邮件系统、云端及文件索引同步器资料，将 02 概述及要点更新为六个方向，技术标签同步为 Go、Python、Bleve、SQLite、LangGraph、RKNN。移除来源未支持的 QPS 3 万+ 声明，不把端侧调度设计表述成完整板端验收成果。Home 10 项测试及生产构建通过；任职时间、职称与公司占位文案保持原值。

## 提交前验证（2026-10-04）

用户确认当前效果并授权提交推送。最终状态为燕麦暖白主题、透明加粗履历、新版 02 文案、三类文章、六项项目及掘金入口。新鲜验证：前端 36 项、模型契约 10 项、模型精修 15 项测试通过；生产构建通过；正式 GLB 结构 0 错误 / 0 警告。系统 Python 缺少 numpy，切换项目原有 .codex-model-tools 环境后精修测试通过。真机性能未新增验证，已有构建体积和 Browserslist 提示保留。
