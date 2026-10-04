import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'

// 分别捕获桌面与窄屏的正式首帧；CSS 按高度缩放，保持与相机纵向视角一致。
const baseURL = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:5173'
const variants = [
    { width: 1440, filename: 'character-static.png' },
    { width: 800, filename: 'character-static-compact.png' },
]
const browser = await chromium.launch({
    channel: process.env.PORTFOLIO_BROWSER_CHANNEL || 'chrome',
    headless: true,
})
try {
    await fs.mkdir('public/images', { recursive: true })
    for (const { width, filename } of variants) {
        const page = await browser.newPage({
            viewport: { width, height: 1000 },
            deviceScaleFactor: 1,
        })
        await page.goto(baseURL)
        await page.waitForSelector('.home-page[data-scene-status="ready"]', {
            timeout: 25000,
        })
        // 同一动画帧内读取画布，保留透明背景并排除页面 UI。
        const data = await page.evaluate(
            () =>
                new Promise((resolve) =>
                    requestAnimationFrame(() =>
                        resolve(
                            document
                                .querySelector('.character-canvas canvas')
                                .toDataURL('image/png'),
                        ),
                    ),
                ),
        )
        const bytes = Buffer.from(data.split(',')[1], 'base64')
        const file = `public/images/${filename}`
        await fs.writeFile(file, bytes)
        console.log(
            JSON.stringify({
                file,
                bytes: bytes.length,
                sha256: createHash('sha256').update(bytes).digest('hex'),
            }),
        )
        await page.close()
    }
} finally {
    await browser.close()
}
