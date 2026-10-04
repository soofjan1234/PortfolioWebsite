/** 将范围外输入钳位，避免首尾滚动让镜头或轨道超出有效区间。 */
export function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value))
}

/** 用同一锚点序列定位镜头和焦点；直接计算保证反向滚动可以恢复。 */
export function getSceneState(scrollY, viewportHeight, anchors, config) {
    // 1. 锚点到达视口 30% 时停靠；首屏始终从 0 帧开始。
    const stops = anchors.map((anchor, index) =>
        index === 0 ? 0 : Math.max(0, anchor.top - viewportHeight * 0.3),
    )
    let index = 0
    while (index < stops.length - 1 && scrollY >= stops[index + 1]) index++
    const next = Math.min(index + 1, stops.length - 1)
    const progress =
        next === index
            ? 0
            : clamp(
                  (scrollY - stops[index]) /
                      Math.max(1, stops[next] - stops[index]),
              )
    // 2. 沿用参考站前后各 35% 的停靠，集中在中段推进镜头。
    const travel = clamp((progress - 0.35) / 0.3)
    const mix = travel * travel * (3 - 2 * travel)
    return {
        frame: (anchors[index].frame ?? index * config.framesPerEntry) * (1 - mix)
            + (anchors[next].frame ?? next * config.framesPerEntry) * mix,
        focusFrom: anchors[index].focus,
        focusTo: anchors[next].focus,
        focusMix: mix,
        stage: anchors[mix < 0.5 ? index : next].id,
    }
}

/** 以真实滚动距离计算叠层；反向滚动无需恢复历史动画状态。 */
export function getHomePresentation(scrollY, viewportHeight, contentTop) {
    const heroProgress = clamp(scrollY / Math.max(1, viewportHeight * 0.36))
    return {
        heroOpacity: 1 - heroProgress,
        heroBlur: heroProgress * 16,
        heroY: -heroProgress * 72,
        railOpacity: clamp((scrollY / viewportHeight - 0.5) / 0.6),
        scrimOpacity: clamp(scrollY / 520) * 0.4,
        fogOpacity: clamp((scrollY + viewportHeight - contentTop) / (viewportHeight * 0.5)) * 0.41,
    }
}

/** 只映射栏目内的纵向距离，不拦截滚轮；末尾和反向都能正常离开。 */
export function getHorizontalState({
    top,
    height,
    viewportHeight,
    trackWidth,
    viewportWidth,
}) {
    const overflow = Math.max(0, trackWidth - viewportWidth)
    const range = Math.max(0, height - viewportHeight)
    const progress = range && overflow ? clamp(-top / range) : 0
    return { progress, offset: progress * overflow }
}

/** 设备能力决定交互模式；减少动态效果优先于所有三维动画。 */
export function getMotionPolicy({ width, coarse, reduced }) {
    const desktop = width >= 900 && !coarse && !reduced
    return {
        scene: !reduced,
        gaze: desktop,
        dof: desktop,
        dpr: desktop ? 1.75 : 1.25,
        horizontal: desktop ? 'scroll' : 'native',
    }
}

/** 从现有纯文本或 Markdown 列表提取文章，保留 HTTP(S) 地址及中文标题。 */
export function parseArticleLinks(content) {
    return content.split('\n').flatMap((line) => {
        const markdown = line.match(/^\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/)
        const plain = line.match(/^\s*(.*?)\s+(https?:\/\/\S+)\s*$/)
        const match = markdown || plain
        return match
            ? [
                  {
                      title: match[1].trim().replace(/^[-*]\s*/, ''),
                      href: match[2],
                  },
              ]
            : []
    })
}
