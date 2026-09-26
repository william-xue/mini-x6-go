import test from 'node:test'
import assert from 'node:assert/strict'
import {
  alphaOfColor,
  isSolidFill,
  markBuriedPoints,
  pointInRing,
  splitVisibleRuns,
} from '../src/occlusion.js'
import { nearestVisibleOnShape } from '../src/visible-outline.js'

/** 造一圈矩形的采样点（顺时针，末点回到首点）。 */
function rectRing(x, y, width, height, perEdge = 5) {
  const points = []
  for (let i = 0; i < perEdge; i += 1) points.push({ x: x + (width * i) / perEdge, y })
  for (let i = 0; i < perEdge; i += 1) points.push({ x: x + width, y: y + (height * i) / perEdge })
  for (let i = 0; i < perEdge; i += 1) points.push({ x: x + width - (width * i) / perEdge, y: y + height })
  for (let i = 0; i < perEdge; i += 1) points.push({ x, y: y + height - (height * i) / perEdge })
  points.push({ x, y })
  return points
}

// ── 颜色的 alpha ──────────────────────────────────────────────
test('alphaOfColor：none / transparent 算 0，其余算 1', () => {
  assert.equal(alphaOfColor('none'), 0)
  assert.equal(alphaOfColor('transparent'), 0)
  assert.equal(alphaOfColor('rgb(0, 0, 0)'), 1)
  assert.equal(alphaOfColor('#dbe7ff'), 1)
  assert.equal(alphaOfColor('red'), 1)
  assert.equal(alphaOfColor('rgba(0, 0, 0, 0)'), 0)
  assert.equal(alphaOfColor('rgba(0, 0, 0, 0.5)'), 0.5)
})

// ── 谁算"遮挡者" ──────────────────────────────────────────────
test('isSolidFill：不透明填充才算遮挡', () => {
  assert.equal(isSolidFill({ fill: 'rgb(219, 231, 255)', fillOpacity: '1', opacity: '1' }), true)
  // 没写 fill 的元素，计算值是黑色实心 —— 它确实挡得住
  assert.equal(isSolidFill({ fill: 'rgb(0, 0, 0)', fillOpacity: '1', opacity: '1' }), true)
  // 无填充 / 透明 / 半透明，都不算
  assert.equal(isSolidFill({ fill: 'none', fillOpacity: '1', opacity: '1' }), false)
  assert.equal(isSolidFill({ fill: 'rgb(0, 0, 0)', fillOpacity: '0', opacity: '1' }), false)
  assert.equal(isSolidFill({ fill: 'rgb(0, 0, 0)', fillOpacity: '0.4', opacity: '1' }), false)
  assert.equal(isSolidFill({ fill: 'rgb(0, 0, 0)', fillOpacity: '1', opacity: '0.4' }), false)
  assert.equal(isSolidFill({ fill: 'rgba(0, 0, 0, 0)', fillOpacity: '1', opacity: '1' }), false)
  assert.equal(isSolidFill({ fill: 'rgb(0,0,0)', fillOpacity: '1', opacity: '1', display: 'none' }), false)
  assert.equal(isSolidFill(null), false)
})

// ── 射线法 ────────────────────────────────────────────────────
test('pointInRing：凸多边形、凹多边形、外面', () => {
  const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]
  assert.equal(pointInRing({ x: 5, y: 5 }, square), true)
  assert.equal(pointInRing({ x: 15, y: 5 }, square), false)
  assert.equal(pointInRing({ x: 5, y: -1 }, square), false)

  // L 形：凹口里的点必须判成"在外面"
  const lShape = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 10 }, { x: 0, y: 10 }]
  assert.equal(pointInRing({ x: 2, y: 2 }, lShape), true, 'L 的角里 → 在')
  assert.equal(pointInRing({ x: 8, y: 8 }, lShape), false, '凹口里 → 不在')
})

// ── 遮挡判定 ──────────────────────────────────────────────────
test('重叠的两个矩形：只有"画在上面"那个挡住下面那个', () => {
  // A 在下面（order 1），B 画在 A 上面（order 2），B 的填充盖住 A 的右边缘
  const a = { id: 'A', tag: 'rect', solid: true, order: 1, points: rectRing(100, 100, 200, 200) }
  const b = { id: 'B', tag: 'rect', solid: true, order: 2, points: rectRing(250, 100, 200, 200) }
  const stats = markBuriedPoints([a, b])

  const rightEdgeOfA = a.points.filter((point) => point.x === 300)
  assert.ok(rightEdgeOfA.length >= 4, 'A 的右边缘应该有若干个采样点')
  assert.ok(
    rightEdgeOfA.every((point) => point.buried === true),
    'A 的右边缘整条落在 B 的填充里（含正压在 B 上下两条边上的那两个端点）→ 必须全部判为被埋',
  )

  assert.equal(
    b.points.some((point) => point.buried),
    false,
    'B 画在上面，它自己一个点都不该被埋 —— 否则会把看得见的边白白丢掉',
  )

  assert.equal(stats.buriedShapes, 0, 'A 只是右边缘被埋，不是整条被埋')
  assert.ok(stats.buriedPoints >= 4)
})

test('完全重合的两个图形：下面那个整条被埋，上面那个完好', () => {
  const bottom = { id: 'lo', tag: 'rect', solid: true, order: 1, points: rectRing(0, 0, 100, 100) }
  const top = { id: 'hi', tag: 'rect', solid: true, order: 2, points: rectRing(0, 0, 100, 100) }
  const stats = markBuriedPoints([bottom, top])

  assert.equal(bottom.buriedCount, bottom.points.length, '下面那个完全看不见了')
  assert.equal(top.buriedCount, 0, '上面那个完全看得见')
  assert.equal(stats.buriedShapes, 1)
})

test('没有实心填充的图形挡不住 anything（描边轮廓不算遮挡）', () => {
  const outline = { id: 'O', tag: 'rect', solid: false, order: 2, points: rectRing(40, 40, 220, 220) }
  const inner = { id: 'I', tag: 'rect', solid: true, order: 1, points: rectRing(100, 100, 100, 100) }
  markBuriedPoints([inner, outline])
  assert.equal(
    inner.points.some((point) => point.buried),
    false,
    '外面那圈只有描边（fill:none）→ 不该把里面那个埋掉',
  )
})

test('不带绘制顺序的轮廓（位图/文字/use 解出来的）不参与遮挡判定', () => {
  const geometry = { id: 'G', tag: 'rect', solid: true, order: 1, points: rectRing(100, 100, 200, 200) }
  const resolved = { id: 'R', tag: 'rect', solid: true, points: rectRing(120, 120, 60, 60) } // 没有 order
  const stats = markBuriedPoints([geometry, resolved])

  assert.equal(resolved.points.some((point) => point.buried), false, '它一个点都不该被动')
  assert.equal(resolved.buriedCount, undefined)
  assert.equal(geometry.points.some((point) => point.buried), false, '它也不该被这个无顺序的东西埋')
  assert.equal(stats.totalPoints, geometry.points.length, '统计里只算参与的图形')
})

// ── 可见段 ────────────────────────────────────────────────────
test('splitVisibleRuns：中间被埋一段 → 切成两条', () => {
  const points = [
    { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: 2, y: 0, buried: true }, { x: 3, y: 0, buried: true },
    { x: 4, y: 0 }, { x: 5, y: 0 },
  ]
  const runs = splitVisibleRuns(points)
  assert.equal(runs.length, 2)
  assert.deepEqual(runs.map((run) => run.length), [2, 2])
})

test('splitVisibleRuns：一个点都没被埋 → 还是一条（画出来和 13.1 一样）', () => {
  const points = rectRing(0, 0, 10, 10)
  const runs = splitVisibleRuns(points)
  assert.equal(runs.length, 1)
  assert.equal(runs[0].length, points.length)
})

test('nearestVisibleOnShape：跳过被埋的段，落到看得见的那条边上', () => {
  const points = rectRing(100, 100, 200, 200)
  for (const point of points) if (point.x === 300) point.buried = true // 右边缘被埋

  // 点在右边缘外侧：如果不过滤，会落到 x=300；过滤后应该落到上边或下边
  const snapped = nearestVisibleOnShape(points, { x: 320, y: 200 }, true, Number.POSITIVE_INFINITY)
  assert.ok(snapped, '还有可见的边，必须给得出落点')
  assert.notEqual(snapped.point.x, 300, '不该落在那条看不见的边上')
  assert.equal(snapped.point.y === 100 || snapped.point.y === 300, true, '应该落到可见的上边或下边')

  // 点在左边缘内侧：正常落到左边
  const left = nearestVisibleOnShape(points, { x: 108, y: 200 }, true, Number.POSITIVE_INFINITY)
  assert.equal(Math.round(left.point.x), 100)
})

test('nearestVisibleOnShape：整条都被埋 → 落点为空（不给假答案）', () => {
  const points = rectRing(100, 100, 200, 200)
  for (const point of points) point.buried = true
  assert.equal(nearestVisibleOnShape(points, { x: 200, y: 200 }, true, Number.POSITIVE_INFINITY), null)
})

test('nearestVisibleOnShape：没有 buried 标记时与 13.3 的行为一致', () => {
  const points = rectRing(0, 0, 100, 100)
  const snapped = nearestVisibleOnShape(points, { x: 50, y: -10 }, true, Number.POSITIVE_INFINITY)
  assert.equal(Math.round(snapped.point.x), 50)
  assert.equal(Math.round(snapped.point.y), 0)
  assert.equal(snapped.direction, 'top')
})

test('共边（两个矩形贴在一起）：边界容差让结果确定，不出现"一半灰一半紫"', () => {
  // 下面那个的右边缘正好压在左边缘上 → 距离 0，必须判被埋（射线法本身对边界没有答案）
  const a = { id: 'A', tag: 'rect', solid: true, order: 1, points: rectRing(0, 0, 100, 100) }
  const b = { id: 'B', tag: 'rect', solid: true, order: 2, points: rectRing(100, 0, 100, 100) }
  markBuriedPoints([a, b])

  const sharedEdgeOfA = a.points.filter((point) => point.x === 100)
  assert.ok(sharedEdgeOfA.length >= 4)
  assert.ok(sharedEdgeOfA.every((point) => point.buried === true), 'A 压在 B 左边缘上的那条边 → 判被埋')
  assert.equal(b.points.some((point) => point.buried), false, 'B 在上面，它的左边缘仍然可以放引脚')
})
