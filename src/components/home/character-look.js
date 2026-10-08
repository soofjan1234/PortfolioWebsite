// 已验收灯光固定保留；候选参数仅通过显式预览入口启用。
const CURRENT_LIGHTING = {
    exposure: .86, environment: .32, hemisphere: .42,
    keyColor: '#ffe2cb', keyIntensity: .65, keyPosition: [3, 3.5, 4],
    softColor: '#ffe8d8', softIntensity: 4.5, softWidth: 4, softHeight: 4, softPosition: [2.5, 2.5, 3.5],
    fillColor: '#b3d5ec', fillIntensity: .6, fillPosition: [-3, 1, 2],
    rimColor: '#a8d4ed', rimIntensity: 2.2, rimPosition: [-2, 3, -2],
}
// 主光与补光拉开方向和强度，眼睛的湿润高光与脸部明暗都在真实网页中验收。
const NATURAL_LIGHTING = {
    exposure: .90, environment: .22, hemisphere: .22,
    keyColor: '#fff0df', keyIntensity: 1, keyPosition: [-3, 4, 4],
    softColor: '#fff4eb', softIntensity: 3.5, softWidth: 2.2, softHeight: 3, softPosition: [-2.8, 3.2, 4],
    fillColor: '#d8e8f2', fillIntensity: .25, fillPosition: [3, 1, 2],
    rimColor: '#c4d8e5', rimIntensity: .75, rimPosition: [2, 3, -2],
}

/** 只允许固定候选资源，原灯光对照用于隔离材质和修型变化。 */
export function getCharacterLook(search) {
    const query = new URLSearchParams(search)
    const natural = query.get('quality') === 'natural'
    return {
        natural,
        modelPath: natural ? '/models/me-natural-candidate.glb' : '/models/me.glb',
        lighting: natural && query.get('lighting') !== 'baseline' ? NATURAL_LIGHTING : CURRENT_LIGHTING,
    }
}
