import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

// 以生产预览为默认入口；证据固定落在当前主题，运行环境可覆盖浏览器频道。
const baseURL = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173'
const output = path.resolve(
    'docs/changes/2026-10-04-character-resume/assets/home-reference',
)
const report = {
    executedAt: new Date().toISOString(),
    timezone: 'Asia/Shanghai',
    baseURL,
    checks: [],
    errors: [],
}
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({
    channel: process.env.PORTFOLIO_BROWSER_CHANNEL || 'chrome',
    headless: true,
})

/** 相机加入阻尼后，帧号到站与画面停稳分开验收；连续三次位置一致才截取。 */
async function waitForCameraRest(page) {
    const canvas = page.locator('.character-canvas canvas')
    if (!(await canvas.count())) return
    let previous = '', stable = 0
    for (let attempt = 0; attempt < 64; attempt++) {
        const position = await canvas.getAttribute('data-camera-position')
        stable = position && position === previous ? stable + 1 : 0
        if (stable >= 2) return
        previous = position
        await page.waitForTimeout(50)
    }
    throw new Error('镜头在 3.2 秒内没有停稳')
}

/** 等待滚动布局与下一次绘制，截图不保存过渡中的合成层。 */
async function screenshot(page, filename) {
    await waitForCameraRest(page)
    await page.evaluate(
        () =>
            new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
    )
    await page.waitForTimeout(80)
    await page.screenshot({ path: path.resolve(output, filename) })
}

/** 保存单项结论，失败时仍保留已执行的检查和首个错误。 */
async function check(name, run) {
    try {
        await run()
        report.checks.push({ name, passed: true })
    } catch (error) {
        report.checks.push({ name, passed: false, error: error.message })
        throw error
    }
}

/** 新建隔离设备环境，仅记录未处理脚本错误，预期网络失败单独断言。 */
async function createPage(options = {}) {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        ...options,
    })
    const page = await context.newPage()
    page.on('pageerror', (error) => report.errors.push(error.message))
    return { context, page }
}

/** 等待场景状态和图片淡出完成，让截图保存实际模型画面。 */
async function openHome(page, status = 'ready') {
    await page.goto(baseURL)
    await page.waitForSelector(`.home-page[data-scene-status="${status}"]`, {
        timeout: 25000,
    })
    if (status === 'ready')
        await page.waitForFunction(
            () =>
                getComputedStyle(document.querySelector('.static-character'))
                    .opacity === '0',
        )
}

/** 使用文档位置跳转，镜头停靠线与页面生产算法保持相同约定。 */
async function stopAt(page, id, frame) {
    await page.evaluate((id) => {
        const element = document.querySelector(`[data-scene-anchor="${id}"]`)
        window.scrollTo(
            0,
            element.getBoundingClientRect().top + scrollY - innerHeight * 0.3,
        )
    }, id)
    await page.waitForFunction(
        (frame) =>
            Math.abs(
                Number(document.querySelector('canvas')?.dataset.frame) - frame,
            ) < 0.02,
        frame,
    )
    await waitForCameraRest(page)
}

/** 检查所有内容仍挂载，且页面本身没有横向溢出。 */
async function assertReadable(page) {
    await page.waitForFunction(() => {
        const image = document.querySelector('.static-character')
        return image?.complete && image.naturalWidth > 0
    })
    assert.equal(
        await page
            .getByRole('heading', { name: '广州大学', exact: true })
            .count(),
        1,
    )
    assert.equal(
        await page
            .getByRole('heading', { name: 'Go 后端工程师', exact: true })
            .count(),
        1,
    )
    assert.equal(await page.getByRole('link', { name: /查看项目/ }).count(), 4)
    assert.equal(await page.getByRole('button', { name: /^阅读 / }).count(), 8)
    assert.ok(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    )
    assert.ok(
        await page
            .locator('.static-character')
            .evaluate(
                (element) => element.complete && element.naturalWidth > 0,
            ),
    )
}

/** 将桌面轨道滚到指定进度，再核对真实横向滚动距离。 */
async function railAt(page, id, fraction) {
    const expected = await page.evaluate(
        ({ id, fraction }) => {
            const rail = document.querySelector(`[data-rail="${id}"]`),
                viewport = rail.querySelector('.rail-viewport')
            const overflow = viewport.scrollWidth - viewport.clientWidth
            window.scrollTo(
                0,
                rail.getBoundingClientRect().top +
                    scrollY +
                    overflow * fraction,
            )
            return overflow * fraction
        },
        { id, fraction },
    )
    await page.waitForFunction(
        ({ id, expected }) =>
            Math.abs(
                document.querySelector(`[data-rail="${id}"] .rail-viewport`)
                    .scrollLeft - expected,
            ) < 2,
        { id, expected },
    )
    return expected
}

try {
    const desktop = await createPage(),
        page = desktop.page
    await check('桌面首屏、模型加载及完整内容', async () => {
        await openHome(page)
        await assertReadable(page)
        assert.equal(
            await page.locator('canvas').getAttribute('data-dof'),
            'true',
        )
        await screenshot(page, 'desktop-hero.png')
    })
    await check('参考站构图：全视口人物、下方居中简介和右侧履历', async () => {
        const layout = await page.evaluate(() => ({
            viewport: { width: innerWidth, height: innerHeight },
            scene: document.querySelector('.home-scene').getBoundingClientRect().toJSON(),
            intro: document.querySelector('.hero-intro').getBoundingClientRect().toJSON(),
            resume: document.querySelector('.resume-copy').getBoundingClientRect().toJSON(),
            stickers: Number(document.querySelector('canvas').dataset.stickers),
        }))
        assert.equal(layout.scene.top, 0)
        assert.ok(Math.abs(layout.scene.width - layout.viewport.width) < 8)
        assert.ok(Math.abs((layout.intro.left + layout.intro.right) / 2 - layout.viewport.width / 2) < 8)
        assert.ok(layout.intro.top > layout.viewport.height * 0.65)
        assert.ok(layout.intro.bottom <= layout.viewport.height)
        assert.ok(layout.resume.left > layout.viewport.width * 0.5)
        assert.equal(layout.stickers, 4)
    })
    await check('桌面独立眼球跟随', async () => {
        await page.mouse.move(150, 150)
        await page.waitForTimeout(80)
        const first = await page
            .locator('canvas')
            .getAttribute('data-eye-rotation')
        await page.mouse.move(1350, 650)
        await page.waitForFunction(
            (first) =>
                document.querySelector('canvas').dataset.eyeRotation !== first,
            first,
        )
    })
    await check('履历镜头、焦点同步与反向恢复', async () => {
        await stopAt(page, 'education', 50)
        await screenshot(page, 'desktop-education.png')
        const camera = await page
            .locator('canvas')
            .getAttribute('data-camera-position')
        await stopAt(page, 'work', 100)
        assert.notEqual(
            await page.locator('canvas').getAttribute('data-camera-position'),
            camera,
        )
        await screenshot(page, 'desktop-work.png')
        await stopAt(page, 'education', 50)
        assert.equal(
            await page.locator('canvas').getAttribute('data-camera-position'),
            camera,
        )
    })
    await check('作品和 Tech Hub 横向首尾、退出与反向浏览', async () => {
        for (const id of ['works', 'tech-hub']) {
            assert.equal(
                await page
                    .locator(`[data-rail="${id}"]`)
                    .getAttribute('data-mode'),
                'scroll',
            )
            await railAt(page, id, 0)
            await screenshot(page, `desktop-${id}-start.png`)
            const half = await railAt(page, id, 0.5)
            assert.ok(half > 0)
            await railAt(page, id, 1)
            await screenshot(page, `desktop-${id}-end.png`)
            await page.evaluate((id) => {
                const rail = document.getElementById(id)
                window.scrollTo(
                    0,
                    rail.getBoundingClientRect().top +
                        scrollY +
                        rail.offsetHeight +
                        20,
                )
            }, id)
            await page.waitForFunction(
                (id) =>
                    document
                        .querySelector(`#${id} .horizontal-sticky`)
                        .getBoundingClientRect().top < 0,
                id,
            )
            await railAt(page, id, 0)
        }
    })
    await check('八类真实文章、键盘关闭与焦点恢复', async () => {
        const buttons = await page.getByRole('button', { name: /^阅读 / }).all()
        let articleCount = 0
        for (const button of buttons) {
            await button.focus()
            await button.press('Enter')
            const dialog = page.getByRole('dialog')
            await dialog.locator('.article-list > a').first().waitFor()
            const count = await dialog.locator('.article-list > a').count()
            assert.ok(count > 0)
            articleCount += count
            await page.keyboard.press('Escape')
            await dialog.waitFor({ state: 'hidden' })
            assert.ok(
                await button.evaluate(
                    (element) => document.activeElement === element,
                ),
            )
        }
        report.articleCount = articleCount
    })
    await check('文章请求失败、重试和原页面入口', async () => {
        await page.route('**/knowledge/go.md', (route) => route.abort())
        const button = page.getByRole('button', {
            name: '阅读 Go 语言基础与进阶',
        })
        await button.focus()
        await button.press('Enter')
        await page.getByText('文章列表暂时无法加载').waitFor()
        assert.equal(
            await page
                .getByRole('link', { name: '前往完整 Tech Hub' })
                .getAttribute('href'),
            '/projects',
        )
        await screenshot(page, 'article-failure.png')
        await page.unroute('**/knowledge/go.md')
        await page.getByRole('button', { name: '重新加载' }).click()
        await page.locator('.article-list > a').first().waitFor()
        const popupEvent = page.waitForEvent('popup')
        const link = page.locator('.article-list > a').first()
        const href = await link.getAttribute('href')
        await link.click()
        const popup = await popupEvent
        await popup.waitForURL(href, { waitUntil: 'commit' })
        await popup.close()
        await page.keyboard.press('Escape')
    })
    await check('作品入口、邮件和微信联系可操作', async () => {
        const project = page.getByRole('link', { name: /查看项目/ }).first()
        await project.focus()
        const popupEvent = page.waitForEvent('popup')
        await project.press('Enter')
        const popup = await popupEvent
        await popup.waitForURL(
            /github.com\/soofjan1234\/ContentCreatorHelper/,
            { waitUntil: 'commit' },
        )
        await popup.close()
        await page.locator('#contact').scrollIntoViewIfNeeded()
        assert.match(
            await page
                .getByRole('link', { name: /发送邮件/ })
                .getAttribute('href'),
            /^mailto:/,
        )
        await page.getByRole('button', { name: /微信联系/ }).click()
        await page.getByText('WeChat Contact').waitFor()
        await page.waitForFunction(() => {
            const image = document.querySelector('img[alt="WeChat QR Code"]')
            return image?.complete && image.naturalWidth > 0
        })
        assert.ok(
            await page
                .locator('img[alt="WeChat QR Code"]')
                .evaluate(
                    (element) => element.complete && element.naturalWidth > 0,
                ),
        )
        await page.getByRole('button', { name: 'Got it' }).click()
        await screenshot(page, 'desktop-contact.png')
    })
    await check(
        '原 /projects 与 /experience 路由可访问并能返回主页',
        async () => {
            await page.goto(`${baseURL}/projects`)
            await page
                .getByRole('button', { name: 'Classic', exact: true })
                .click()
            await page.getByText('Go 语言基础与进阶', { exact: true }).waitFor()
            await screenshot(page, 'existing-tech-hub.png')
            await page.goto(`${baseURL}/experience`)
            await page.locator('main').waitFor()
            await page.getByRole('link', { name: 'Soofjan 首页' }).click()
            await page.waitForSelector('.home-page[data-scene-status="ready"]')
            assert.equal(await page.locator('canvas').count(), 1)
        },
    )
    await check('运行中切换减少动态效果，三维清理及恢复无重复画布', async () => {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.waitForSelector('.home-page[data-scene-status="static"]')
        await assertReadable(page)
        assert.equal(await page.locator('canvas').count(), 0)
        assert.equal(await page.locator('#tech-hub').getAttribute('data-mode'), 'native')
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await page.waitForSelector('.home-page[data-scene-status="ready"]')
        assert.equal(await page.locator('canvas').count(), 1)
    })
    await desktop.context.close()

    for (const device of [
        {
            name: 'mobile',
            width: 390,
            height: 844,
            isMobile: true,
            hasTouch: true,
        },
        {
            name: 'small-mobile',
            width: 320,
            height: 740,
            isMobile: true,
            hasTouch: true,
        },
        { name: 'short-desktop', width: 1280, height: 720 },
    ]) {
        const { name, width, height, ...options } = device
        const client = await createPage({
            viewport: { width, height },
            ...options,
        })
        await check(`${name} 首屏、完整浏览与无页面溢出`, async () => {
            await openHome(client.page)
            await assertReadable(client.page)
            const introBottom = await client.page.locator('.hero-intro').evaluate(element => element.getBoundingClientRect().bottom)
            assert.ok(introBottom <= height, '简介必须在首屏可见，横屏不被最小高度推走')
            await screenshot(client.page, `${name}-hero.png`)
            if (options.hasTouch) {
                assert.equal(
                    await client.page
                        .locator('canvas')
                        .getAttribute('data-gaze'),
                    'false',
                )
                assert.equal(
                    await client.page
                        .locator('canvas')
                        .getAttribute('data-dof'),
                    'false',
                )
                await client.page
                    .getByRole('button', { name: '打开导航菜单' })
                    .click()
                await client.page
                    .locator('#mobile-navigation')
                    .getByRole('link', { name: 'WORKS' })
                    .click()
                assert.equal(
                    await client.page.locator('#mobile-navigation').count(),
                    0,
                )
            }
            for (const id of [
                'education',
                'work',
                'works',
                'tech-hub',
                'contact',
            ]) {
                if (options.hasTouch) {
                    await client.page.locator(`#${id}`).scrollIntoViewIfNeeded()
                    if (['works', 'tech-hub'].includes(id)) {
                        assert.equal(
                            await client.page
                                .locator(`#${id}`)
                                .getAttribute('data-mode'),
                            'native',
                        )
                        await client.page
                            .getByRole('button', {
                                name:
                                    id === 'works'
                                        ? '下一组Selected Works'
                                        : '下一组Tech Hub',
                            })
                            .click()
                        await client.page.waitForFunction(
                            (id) =>
                                document.querySelector(`#${id} .rail-viewport`)
                                    .scrollLeft > 100,
                            id,
                        )
                        await client.page
                            .locator(`#${id} .rail-viewport`)
                            .evaluate((element) =>
                                element.scrollTo({
                                    left: element.scrollWidth,
                                    behavior: 'instant',
                                }),
                            )
                    }
                } else if (['works', 'tech-hub'].includes(id))
                    await railAt(client.page, id, 0)
                else
                    await client.page.locator(`#${id}`).scrollIntoViewIfNeeded()
                await screenshot(client.page, `${name}-${id}.png`)
            }
            await client.page
                .getByRole('button', { name: '阅读 其他源码', exact: true })
                .focus()
            await client.page
                .getByRole('button', { name: '阅读 其他源码', exact: true })
                .click()
            await client.page.locator('.article-list > a').first().waitFor()
            await client.page
                .getByRole('button', { name: '关闭文章列表' })
                .click()
            if (options.hasTouch) {
                await client.page.setViewportSize({
                    width: height,
                    height: width,
                })
                await client.page.evaluate(() => window.scrollTo(0, 0))
                await assertReadable(client.page)
                await screenshot(client.page, `${name}-landscape.png`)
                assert.equal(
                    await client.page
                        .locator('#works')
                        .getAttribute('data-mode'),
                    'native',
                )
            }
        })
        await client.context.close()
    }

    const reduced = await createPage({ reducedMotion: 'reduce' })
    await check('减少动态效果不请求 GLB，静态人物和横滑阅读完整', async () => {
        let requests = 0
        reduced.page.on('request', (request) => {
            if (request.url().endsWith('/models/me.glb')) requests++
        })
        await openHome(reduced.page, 'static')
        await assertReadable(reduced.page)
        assert.equal(await reduced.page.locator('canvas').count(), 0)
        assert.equal(requests, 0)
        assert.equal(
            await reduced.page.locator('#works').getAttribute('data-mode'),
            'native',
        )
        await screenshot(reduced.page, 'reduced-motion.png')
    })
    await reduced.context.close()

    for (const failure of [
        'model-download',
        'model-parse',
        'webgl',
        'context-loss',
        'model-timeout',
        'scene-module',
    ]) {
        const client = await createPage()
        await check(`${failure} 降级仍可阅读和打开文章`, async () => {
            if (failure === 'model-download')
                await client.page.route('**/models/me.glb', (route) =>
                    route.abort(),
                )
            if (failure === 'model-parse')
                await client.page.route('**/models/me.glb', (route) =>
                    route.fulfill({
                        contentType: 'model/gltf-binary',
                        body: 'invalid glb',
                    }),
                )
            if (failure === 'model-timeout')
                await client.page.route('**/models/me.glb', () => {})
            if (failure === 'scene-module')
                await client.page.route(
                    '**/assets/CharacterScene-*.js',
                    (route) => route.abort(),
                )
            if (failure === 'webgl')
                await client.page.addInitScript(() => {
                    const original = HTMLCanvasElement.prototype.getContext
                    HTMLCanvasElement.prototype.getContext = function (
                        kind,
                        ...args
                    ) {
                        return /webgl/.test(kind)
                            ? null
                            : original.call(this, kind, ...args)
                    }
                })
            if (failure === 'context-loss') {
                await openHome(client.page)
                await client.page
                    .locator('canvas')
                    .evaluate((canvas) =>
                        canvas
                            .getContext('webgl2')
                            .getExtension('WEBGL_lose_context')
                            .loseContext(),
                    )
                await client.page.waitForSelector(
                    '.home-page[data-scene-status="error"]',
                )
            } else await openHome(client.page, 'error')
            await assertReadable(client.page)
            assert.equal(await client.page.locator('canvas').count(), 0)
            await screenshot(client.page, `${failure}.png`)
            const button = client.page.getByRole('button', {
                name: '阅读 Go 语言基础与进阶',
                exact: true,
            })
            await button.focus()
            await button.press('Enter')
            await client.page.locator('.article-list > a').first().waitFor()
        })
        await client.context.close()
    }
    assert.deepEqual(report.errors, [])
} catch (error) {
    report.firstFailure = error.message
    process.exitCode = 1
} finally {
    await browser.close()
    report.passed =
        report.checks.every((item) => item.passed) && report.errors.length === 0
    await fs.writeFile(
        path.join(output, 'browser-checks.json'),
        JSON.stringify(report, null, 2) + '\n',
    )
    console.log(
        JSON.stringify({
            passed: report.passed,
            checks: report.checks.length,
            articleCount: report.articleCount,
            scriptErrors: report.errors.length,
            firstFailure: report.firstFailure,
            report: path.join(output, 'browser-checks.json'),
        }),
    )
}
