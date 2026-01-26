# Skills 是什么

Skills 是给 Agent（如 Claude）用的技能包，通过提供专业知识、工作流程和工具来扩展 AI 的能力。可以将它们视为特定领域或任务的"入门指南"。

## 案例：AI 选题系统

数字生命卡兹克分享的 AI 选题系统：

**选题 = 海量输入到少量输出的转化漏斗**

系统架构：1个 Agent（总控中枢）+ 3个 Skill

**工作流程：**
1. **第1步**：热点采集 skill 采集全网热点，从多个平台抓取最新热点
2. **第2步**：选题生成 skill 自己分辨，然后筛选并生成 TOP10 值得关注的选题，包含"事件描述+核心角度+标题"
3. **第3步**：审核 skill 使用方法论，审核上一步输出的所有选题
4. **迭代机制**：当选题审核不通过时，系统不会结束，而是由审核 Skill 给出不通过 + 修改意见，接着主 Agent 读取反馈把修改意见作为上下文，重新调用选题生成 Skill 修改不通过的选题，再次进入审核流程，不断迭代，直到审核通过为止

## 新手入门：如何制作一个 Skill

### 第一步：理解 Skill 的基本结构

每个 Skill 至少需要一个 `SKILL.md` 文件，可选的其他资源：

```
my-skill/
├── SKILL.md (必需)
├── scripts/ (可选) - 可执行代码
├── references/ (可选) - 参考资料文档
└── assets/ (可选) - 模板、图标等资源
```

### 第二步：创建最小 Skill 示例

创建一个最简单的 Skill 来测试（以 Cursor 为例，需要在设置BETA里开启nightly模式）：


**1. 创建 Skill**

复制粘贴给AI，开启plan模式，说：“请你帮我创建这个skill”

```markdown
---
name: hello-world
description: 一个简单的测试技能，用于验证 Skill 系统是否正常工作。当用户想要测试 Skill 功能时使用。
---

# Hello World Skill

这是一个最小化的 Skill 示例，用于测试 Skill 系统。

## 功能说明

当这个 Skill 被触发时，AI 助手会：
1. 识别这是一个测试请求
2. 返回一个友好的问候消息
3. 确认 Skill 系统正常工作

## 使用示例

用户可以说：
- "测试一下 skill"
- "运行 hello world skill"
- "验证 skill 是否工作"
```

![](.\image1.png)


**2. 测试 Skill**

在 Cursor 的 AI 对话中尝试触发这个 Skill，例如说："测试一下 skill" 或 "运行 hello world skill"。Cursor 的 AI 助手会自动识别并使用已安装的 Skill。


![](.\image2.png)

## Skill 配置规范

### 1. 命名规范

- **文件夹名称**：必须是小写字母+连字符，例如 `hotspot-collector`（不能有空格、大写）
- **name 字段**：在 YAML 中使用小写字母和连字符

### 2. SKILL.md 结构

SKILL.md 是核心文件，结构固定分为两部分：

**YAML 头部（必需）**：
```yaml
---
name: 你的skill名称
description: 简要描述该技能的功能以及何时该使用它
---
```

**Markdown 主体（必需）**：
```markdown
# 你的技能名称

## 指令 (Instructions)
为 AI 助手提供清晰、逐步的操作指南。

## 示例 (Examples)
展示使用该技能的具体代码或操作案例。
```

### 3. Description 字段的重要性

`description` 字段是 Skill 的**唯一触发机制**，AI 助手（如 Cursor 或 Claude）通过它来判断何时使用这个 Skill。

# 资源

## 示例

- **官方示例库**：https://github.com/anthropics/skills
- **github skills收录**：https://skillsmp.com/
- **安全审计的skill收录**：https://skillstore.io/zh-hans
- **格式转化**：https://skillstore.io/zh-hans/skills/x-89jobrien-file-converter

## Design 

- **UI Skills**：https://ui-skills.com
- **Vercel Agent Skills**：Web interface guidelines 和 React 最佳实践 - https://github.com/vercel-labs/agent-skills
- **Design Motion Principles**：针对动效设计 - https://github.com/kylezantos/design-engineer-auditor-package
- **RAMS**：主要检查 Accessibility (WCAG 2.1)，安装后使用 `/rams` 运行 - https://rams.ai
- **UI UX Pro Max**：https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

## 自动化

https://skillstore.io/zh-hans/skills/x-92bilal26-browser-use
https://skillstore.io/zh-hans/skills/x-21pounder-web-scrape