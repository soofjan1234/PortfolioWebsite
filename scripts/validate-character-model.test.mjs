import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inspectCharacterModel } from './validate-character-model.mjs';

/** 生成含真实三角形二进制数据的 GLB；测试不依赖网络和大型模型。 */
function makeGlb(edit = () => {}, extraFloats = []) {
  const document = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ name: 'character', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{}], buffers: [{ byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }],
  };
  const geometry = [0, 0, 0, 1, 0, 0, 0, 1, 0, ...extraFloats];
  document.buffers[0].byteLength = geometry.length * 4;
  edit(document);
  const json = Buffer.from(JSON.stringify(document));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const bytes = Buffer.alloc(12 + 8 + jsonLength + 8 + geometry.length * 4);
  bytes.write('glTF'); bytes.writeUInt32LE(2, 4); bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(jsonLength, 12); bytes.writeUInt32LE(0x4e4f534a, 16);
  bytes.fill(0x20, 20, 20 + jsonLength); json.copy(bytes, 20);
  bytes.writeUInt32LE(geometry.length * 4, 20 + jsonLength); bytes.writeUInt32LE(0x004e4942, 24 + jsonLength);
  geometry.forEach((value, index) => bytes.writeFloatLE(value, 28 + jsonLength + index * 4));
  return bytes;
}

/** 构造两关键帧的真实相机运动，固定就绪阶段的正向与错误目标行为。 */
function makeReadyGlb(cameraTarget = 3) {
  return makeGlb(document => {
    document.nodes.push(
      { name: 'eye-left', mesh: 0, translation: [-1, 0, 0] },
      { name: 'eye-right', mesh: 0, translation: [1, 0, 0] },
      { name: 'Camera', camera: 0 },
      ...['focus-start', 'focus-1', 'focus-works', 'focus-tech-hub'].map(name => ({ name })),
    );
    document.scenes[0].nodes = document.nodes.map((_, index) => index);
    document.cameras = [{ type: 'perspective', perspective: { yfov: 0.8, znear: 0.1 } }];
    document.bufferViews.push(
      { buffer: 0, byteOffset: 36, byteLength: 8 },
      { buffer: 0, byteOffset: 44, byteLength: 24 },
      { buffer: 0, byteOffset: 68, byteLength: 32 },
    );
    document.accessors.push(
      { bufferView: 1, componentType: 5126, count: 2, type: 'SCALAR', min: [0], max: [1] },
      { bufferView: 2, componentType: 5126, count: 2, type: 'VEC3' },
      { bufferView: 3, componentType: 5126, count: 2, type: 'VEC4' },
    );
    document.animations = [{ name: 'CameraAction',
      samplers: [{ input: 1, output: 2 }, { input: 1, output: 3 }],
      channels: [{ sampler: 0, target: { node: cameraTarget, path: 'translation' } }, { sampler: 1, target: { node: cameraTarget, path: 'rotation' } }],
    }];
  }, [0, 1, 0, 0, 3, 1, 0, 3, 0, 0, 0, 1, 0, 0.6, 0, 0.8]);
}

test('基础 GLB 报告数量和哈希，同时明确缺少交互契约', async () => {
  const report = await inspectCharacterModel(makeGlb(), { stage: 'base', resumeCount: 2 });
  assert.equal(report.valid, true);
  assert.equal(report.counts.vertices, 3);
  assert.equal(report.counts.triangles, 1);
  assert.match(report.sha256, /^[a-f0-9]{64}$/);
  assert.equal(report.contract.valid, false);
  assert.ok(report.contract.issues.includes('缺少可见眼球网格：eye-left'));
  assert.ok(report.contract.issues.includes('缺少可见焦点：focus-2'));
});

test('基础模式通过不能让同一模型通过就绪模式', async () => {
  const report = await inspectCharacterModel(makeGlb(), { stage: 'ready', resumeCount: 1 });
  assert.equal(report.valid, false);
  assert.equal(report.structural.errors, 0);
});

test('拒绝伪装为 GLB 的图片或截断文件', async () => {
  for (const bytes of [Buffer.from('PNG image'), makeGlb().subarray(0, 25)]) {
    const report = await inspectCharacterModel(bytes);
    assert.equal(report.valid, false);
    assert.ok(report.structural.errors > 0);
  }
});

test('拒绝越界的真实网格引用', async () => {
  const report = await inspectCharacterModel(makeGlb(document => { document.nodes[0].mesh = 3; }));
  assert.equal(report.valid, false);
  assert.ok(report.structural.errors > 0);
});

test('仅命名但不在活动场景中的眼球不算就绪', async () => {
  const report = await inspectCharacterModel(makeGlb(document => {
    document.nodes.push({ name: 'eye-left', mesh: 0 }, { name: 'eye-right', mesh: 0 });
  }));
  assert.ok(report.contract.issues.includes('缺少可见眼球网格：eye-left'));
});

test('活动场景里无网格的命名节点不能冒充眼球', async () => {
  const report = await inspectCharacterModel(makeGlb(document => {
    document.nodes.push({ name: 'eye-left' }, { name: 'eye-right' });
    document.scenes[0].nodes.push(1, 2);
  }));
  assert.ok(report.contract.issues.includes('缺少可见眼球网格：eye-left'));
});

test('外部纹理不能被当作自包含网页模型', async () => {
  const report = await inspectCharacterModel(makeGlb(document => {
    document.images = [{ uri: 'file:///private/character.png' }];
    document.textures = [{ source: 0 }];
    document.materials[0].pbrMetallicRoughness = { baseColorTexture: { index: 0 } };
  }));
  assert.equal(report.valid, false);
  assert.ok(report.structural.errors > 0);
});

test('不接受未知阶段或无效履历数量', async () => {
  await assert.rejects(inspectCharacterModel(makeGlb(), { stage: 'finished' }), /stage/);
  await assert.rejects(inspectCharacterModel(makeGlb(), { resumeCount: -1 }), /resumeCount/);
});

test('真实眼球、焦点和有效相机轨道允许通过就绪结构检查', async () => {
  const report = await inspectCharacterModel(makeReadyGlb(), { stage: 'ready' });
  assert.equal(report.valid, true, JSON.stringify(report.structural));
  assert.deepEqual(report.contract.issues, []);
});

test('同名动画驱动身体而非相机时不能通过就绪检查', async () => {
  const report = await inspectCharacterModel(makeReadyGlb(0), { stage: 'ready' });
  assert.equal(report.structural.errors, 0);
  assert.equal(report.valid, false);
  assert.ok(report.contract.issues.includes('CameraAction 缺少有效相机轨道：translation'));
});
