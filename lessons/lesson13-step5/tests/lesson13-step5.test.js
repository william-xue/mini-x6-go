import test from 'node:test'
import assert from 'node:assert/strict'
import { applyCtm } from '../src/index.js'

// 浏览器实测值：素材 viewBox "0 0 200 100" 铺进 868×420 →
// getCTM 给 a=4.2 d=4.2 e=13.99999999999998 f=0
const MEASURED_CTM = { a: 4.2, b: 0, c: 0, d: 4.2, e: 13.99999999999998, f: 0 }

const near = (actual, expected, tol = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < tol, `${actual} 应约等于 ${expected}`)

test('正常模式：点被矩阵换算过去', () => {
  const at = applyCtm(MEASURED_CTM, { x: 14, y: 12 })
  near(at.x, 14 * 4.2 + 14)
  near(at.y, 12 * 4.2)

  const corner = applyCtm(MEASURED_CTM, { x: 188, y: 98 })
  near(corner.x, 188 * 4.2 + 14)
  near(corner.y, 98 * 4.2)
})

test('对比模式：点原样放行 —— 这就是"没有 getCTM"', () => {
  const at = applyCtm(MEASURED_CTM, { x: 14, y: 12 }, true)
  assert.deepEqual(at, { x: 14, y: 12 })
  const corner = applyCtm(MEASURED_CTM, { x: 188, y: 98 }, true)
  assert.deepEqual(corner, { x: 188, y: 98 })
})

test('没有矩阵时也不会炸（对比模式常遇到）', () => {
  assert.deepEqual(applyCtm(null, { x: 7, y: 9 }), { x: 7, y: 9 })
  assert.deepEqual(applyCtm(null, { x: 7, y: 9 }, true), { x: 7, y: 9 })
})

test('把浏览器实测的两组范围钉进来：同一份素材，两种模式差多少', () => {
  // 素材里那条不规则曲线的点（素材坐标）：x 12~188  y 2~98
  const source = { minX: 12, maxX: 188, minY: 2, maxY: 98 }
  const through = (point, ignore) => applyCtm(MEASURED_CTM, point, ignore)

  const a = through({ x: source.minX, y: source.minY }, false)
  const b = through({ x: source.maxX, y: source.maxY }, false)
  assert.deepEqual([Math.round(a.x), Math.round(b.x)], [64, 804], '换算后铺满画布')
  assert.deepEqual([Math.round(a.y), Math.round(b.y)], [8, 412])

  const c = through({ x: source.minX, y: source.minY }, true)
  const d = through({ x: source.maxX, y: source.maxY }, true)
  assert.deepEqual([Math.round(c.x), Math.round(d.x)], [12, 188], '不换算就缩在左上角 200×100 里')
  assert.deepEqual([Math.round(c.y), Math.round(d.y)], [2, 98])
})

test('画布尺寸等于素材尺寸时，矩阵退化成单位矩阵 —— 这时两种模式没有区别', () => {
  // 这正是 13.1 的对照验收能"逐点一致"的原因
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  const point = { x: 240, y: 80 }
  assert.deepEqual(applyCtm(identity, point), applyCtm(identity, point, true))
})
