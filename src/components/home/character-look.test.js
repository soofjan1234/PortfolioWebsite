import { expect, it } from 'vitest'
import { getCharacterLook } from './character-look'

it('普通入口继续使用正式模型与已验收灯光', () => {
    expect(getCharacterLook('')).toMatchObject({ modelPath: '/models/me.glb', natural: false, lighting: { exposure: .86, environment: .32 } })
})

it('只有显式自然候选参数加载候选与新的定向布光', () => {
    expect(getCharacterLook('?quality=natural')).toMatchObject({ modelPath: '/models/me-natural-candidate.glb', natural: true, lighting: { environment: .22 } })
})

it('候选允许沿用当前灯光，隔离材质与眼睑的变化', () => {
    expect(getCharacterLook('?quality=natural&lighting=baseline').lighting).toEqual(getCharacterLook('').lighting)
})

it('未知模型参数不能改变正式资源或注入任意下载地址', () => {
    expect(getCharacterLook('?quality=https://example.com/model.glb')).toEqual(getCharacterLook(''))
})
