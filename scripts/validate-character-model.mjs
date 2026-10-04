import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import validator from 'gltf-validator';

// GLB 2.0 固定头部为 12 字节，首块必须是 JSON；格式错误由官方校验器报告。
const HEADER_BYTES = 12;
const JSON_CHUNK = 0x4e4f534a;

/** 仅解析已经通过格式检查的首个 JSON 块，不把二进制网格写入报告。 */
function readDocument(bytes) {
  if (bytes.length < HEADER_BYTES + 8 || bytes.readUInt32LE(16) !== JSON_CHUNK) return null;
  try {
    return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
  } catch {
    return null;
  }
}

/** 检查活动场景里真实可引用的节点；结构通过仍需人工验收造型与旋转中心。 */
function inspectContract(document, resumeCount) {
  const issues = [];
  const nodes = document.nodes ?? [];
  const reachable = new Set();
  // 1. 从默认场景遍历，避免脱离场景的同名节点制造假通过。
  const visit = index => {
    if (reachable.has(index) || !nodes[index]) return;
    reachable.add(index);
    (nodes[index].children ?? []).forEach(visit);
  };
  (document.scenes?.[document.scene ?? 0]?.nodes ?? []).forEach(visit);
  const named = name => [...reachable].filter(index => nodes[index].name === name);
  for (const name of ['eye-left', 'eye-right']) {
    const matches = named(name);
    const eye = nodes[matches[0]];
    const primitives = document.meshes?.[eye?.mesh]?.primitives ?? [];
    if (matches.length !== 1 || !primitives.some(primitive => document.accessors?.[primitive.attributes?.POSITION]?.count > 0)) {
      issues.push(`缺少可见眼球网格：${name}`);
    } else if ((eye.children ?? []).length > 0) {
      issues.push(`眼球带有子节点，需检查旋转是否牵动其他几何：${name}`);
    }
  }
  // 2. 焦点与履历数量使用同一输入，末尾 Tech Hub 保持自己的停靠点。
  const focusNames = ['focus-start', ...Array.from({ length: resumeCount }, (_, index) => `focus-${index + 1}`), 'focus-works', 'focus-tech-hub'];
  for (const name of focusNames) if (named(name).length !== 1) issues.push(`缺少可见焦点：${name}`);
  // 3. 相机动画必须驱动实际相机或其父级，不能只检查动画名称。
  const cameraNodes = [...reachable].filter(index => document.cameras?.[nodes[index].camera]?.type === 'perspective');
  if (!cameraNodes.length) issues.push('缺少活动场景中的透视相机');
  const cameraTargets = new Set(cameraNodes);
  let previousSize;
  do {
    previousSize = cameraTargets.size;
    for (const index of reachable) {
      if ((nodes[index].children ?? []).some(child => cameraTargets.has(child))) cameraTargets.add(index);
    }
  } while (cameraTargets.size !== previousSize);
  const action = document.animations?.find(animation => animation.name === 'CameraAction');
  if (!action) issues.push('缺少 CameraAction');
  else for (const path of ['translation', 'rotation']) {
    const validTrack = action.channels?.some(channel => {
      const sampler = action.samplers?.[channel.sampler];
      const input = document.accessors?.[sampler?.input];
      const output = document.accessors?.[sampler?.output];
      return cameraTargets.has(channel.target?.node) && channel.target.path === path && input?.count >= 2 && output?.count >= 2;
    });
    if (!validTrack) issues.push(`CameraAction 缺少有效相机轨道：${path}`);
  }
  return { valid: issues.length === 0, issues };
}

/** 校验自包含 GLB，返回精简结构报告；base 与 ready 的通过条件互不混淆。 */
export async function inspectCharacterModel(input, { stage = 'base', resumeCount = 1 } = {}) {
  if (!['base', 'ready'].includes(stage)) throw new TypeError('stage 必须为 base 或 ready');
  if (!Number.isInteger(resumeCount) || resumeCount < 1) throw new TypeError('resumeCount 必须为正整数');
  // 1. 固定报告身份，方便比较下载初稿与网页成品。
  const bytes = Buffer.from(input);
  const report = {
    valid: false, stage, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    counts: {}, structural: { errors: 0, warnings: 0, firstIssue: null },
    contract: { valid: false, issues: ['模型结构未通过，不能检查交互契约'] },
  };
  // 2. 交给 Khronos 官方校验器检查引用、二进制范围、纹理与动画数据。
  let checked;
  try {
    checked = await validator.validateBytes(new Uint8Array(bytes), {
      format: 'glb', writeTimestamp: false, maxIssues: 100,
      externalResourceFunction: async () => { throw new Error('网页 GLB 不允许外部资源依赖'); },
    });
  } catch (error) {
    report.structural = { errors: 1, warnings: 0, firstIssue: String(error) };
    return report;
  }
  report.structural = {
    errors: checked.issues.numErrors, warnings: checked.issues.numWarnings,
    firstIssue: checked.issues.messages.find(issue => issue.severity === 0) ?? checked.issues.messages[0] ?? null,
  };
  if (report.structural.errors) return report;
  const document = readDocument(bytes);
  if (!document) {
    report.structural = { errors: 1, warnings: 0, firstIssue: '缺少有效 GLB JSON 块' };
    return report;
  }
  // 3. 汇总数量并独立检查人物契约；基础模式也展示所有缺项。
  for (const key of ['nodes', 'meshes', 'materials', 'textures', 'cameras', 'animations']) report.counts[key] = document[key]?.length ?? 0;
  report.counts.vertices = checked.info?.totalVertexCount ?? 0;
  report.counts.triangles = checked.info?.totalTriangleCount ?? 0;
  report.counts.primitives = document.meshes?.reduce((total, mesh) => total + mesh.primitives.length, 0) ?? 0;
  report.contract = inspectContract(document, resumeCount);
  report.valid = report.counts.meshes > 0 && (stage === 'base' || report.contract.valid);
  return report;
}

/** 命令行只输出简要报告，失败通过非零退出码传递给验证流程。 */
async function main() {
  const [file, ...options] = process.argv.slice(2);
  if (!file || options.some(option => !/^--(?:stage=(base|ready)|resume-count=\d+)$/.test(option))) {
    throw new Error('用法：node scripts/validate-character-model.mjs 文件.glb [--stage=base|ready] [--resume-count=N]');
  }
  const stage = options.find(option => option.startsWith('--stage='))?.split('=')[1] ?? 'base';
  const resumeCount = Number(options.find(option => option.startsWith('--resume-count='))?.split('=')[1] ?? 1);
  const report = await inspectCharacterModel(await readFile(file), { stage, resumeCount });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.valid ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
