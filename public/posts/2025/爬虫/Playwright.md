> 当网页内容需要 JavaScript 渲染，或者需要模拟复杂的用户交互时，传统的 HTTP 请求方式就无能为力了。Playwright 是一个现代、强大的浏览器自动化库。

# 为什么选择 Playwright

| 特性 | Selenium | Puppeteer | Playwright |
|------|----------|-----------|------------|
| 语言支持 | 多语言 | JS/TS | 多语言 |
| 浏览器支持 | 多浏览器 | 仅 Chromium | Chromium/Firefox/WebKit |
| 自动等待 | 手动 | 部分自动 | 完全自动 |
| 性能 | 较慢 | 快 | 快 |
| 维护 | 活跃 | 活跃 | 微软维护，非常活跃 |

**Playwright 优势**：
- 跨浏览器支持，一套代码支持多浏览器
- 智能自动等待机制，减少 flaky 测试
- 网络拦截，可拦截和修改请求
- 同步/异步 API 双支持

# 等待策略
Playwright 的一大优势是自动等待。当你执行操作时，它会自动等待元素满足条件：
```
# 点击时自动等待元素可见、可交互
await page.click("button.submit")
```

# 拦截网络请求
Playwright 的网络拦截功能可以直接获取 API 返回的 JSON 数据，比解析 DOM 更高效

# 浏览器指纹检测原理
网站通过浏览器指纹看是不是自动化，而stealth.js用于反检测
实际项目中，建议使用完整的 stealth.min.js 文件

