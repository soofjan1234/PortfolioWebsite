// 贴纸使用自己的学校和工程内容，坐标为已验收模型的脸颊区域（glTF 米制单位）。
const STICKERS = [
    { text: 'GZU', caption: '2019 — 2023', x: -0.24, y: 0.16, color: '#b4ce91', angle: -0.18 },
    { text: 'BUILD', caption: 'WITH CURIOSITY', x: -0.24, y: 0.045, color: '#e8c687', angle: 0.16 },
    { text: 'Go', caption: 'BACKEND', x: 0.235, y: 0.17, color: '#8bcbd8', angle: 0.18 },
    { text: 'NAS', caption: 'PRIVATE CLOUD', x: 0.24, y: 0.05, color: '#c9b5d8', angle: -0.12 },
]

/** 将原创文字贴纸投射到真实脸颊表面；不改写 GLB 或覆盖五官。 */
export function createResumeStickers(THREE, DecalGeometry, model) {
    const head = model.getObjectByName('character-head')
    if (!head) return []
    // 1. 射线只命中皮肤，避免贴纸被眼镜、眼球或头发截获。
    model.updateMatrixWorld(true)
    const ray = new THREE.Raycaster(), stickers = []
    for (const item of STICKERS) {
        ray.set(new THREE.Vector3(item.x, item.y, 2), new THREE.Vector3(0, 0, -1))
        const hit = ray.intersectObject(head, false)[0]
        if (!hit) continue
        // 2. 平面法线与皮肤一致，有限投影厚度只覆盖朝向镜头的局部表面。
        const normal = hit.face.normal.clone().transformDirection(head.matrixWorld)
        const projector = new THREE.Object3D()
        projector.position.copy(hit.point)
        projector.lookAt(hit.point.clone().add(normal))
        projector.rotateZ(item.angle)
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 256
        const context = canvas.getContext('2d')
        context.fillStyle = '#f4f1ea'
        context.beginPath()
        context.roundRect(8, 8, 496, 240, 60)
        context.fill()
        context.fillStyle = item.color
        context.beginPath()
        context.roundRect(22, 22, 468, 212, 47)
        context.fill()
        context.fillStyle = '#1d343b'
        context.textAlign = 'center'
        context.font = 'bold 100px sans-serif'
        context.fillText(item.text, 256, 145)
        context.font = '24px sans-serif'
        context.fillText(item.caption, 256, 194)
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })
        const geometry = new DecalGeometry(head, hit.point, projector.rotation, new THREE.Vector3(0.145, 0.073, 0.07))
        const sticker = new THREE.Mesh(geometry, material)
        sticker.name = `resume-sticker-${item.text.toLowerCase()}`
        sticker.renderOrder = 2
        // 3. 模型根节点为单位变换；与模型同生命周期，统一释放几何、纹理和材质。
        model.add(sticker)
        stickers.push(sticker)
    }
    return stickers
}
