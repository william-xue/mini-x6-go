// 13.6 的落点几何：和 13.3 的 nearestPointOnAnyShape **同构**，
// 只多一条规则 —— 段的两端只要有一个被埋，这一段就不参与。
//
// 之所以是"按段过滤"而不是"按图形过滤"：
// 一条轮廓上常常只有**一部分**被盖住（比如下面那个矩形的右边缘被盖，
// 上、左、下三条边都露着）。所以埋伏是**点级**的信息，不是图形级的。

import { angleOf, cardinal4, outwardNormal, pointsFormClosedLoop } from '../../lesson13-step3/src/outline-normal.js'

function projectOnSegment(point, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
    : 0
  const projected = { x: a.x + t * dx, y: a.y + t * dy }
  return { point: projected, distance: Math.hypot(point.x - projected.x, point.y - projected.y) }
}

/** 可见段上的最近点。**唯一的差别**就是循环里那行 `continue`。 */
export function nearestVisibleOnShape(points, point, closed = true, maxDistance = Number.POSITIVE_INFINITY) {
  if (!points || points.length < 2) return null
  const segmentCount = closed ? points.length : points.length - 1

  let best = null
  for (let i = 0; i < segmentCount; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    if (a.buried || b.buried) continue // ← 这条边被盖住了，不参与
    const candidate = projectOnSegment(point, a, b)
    if (!best || candidate.distance < best.distance) best = { ...candidate, segmentIndex: i }
  }
  if (!best || best.distance > maxDistance) return null

  // 法线的绕向仍然按**完整轮廓**算 —— 一部分边看不见，不代表这个形状的绕向变了
  const normal = outwardNormal(points, best.segmentIndex, closed)
  const angle = angleOf(normal)
  return {
    point: best.point,
    distance: best.distance,
    segmentIndex: best.segmentIndex,
    normal,
    angle,
    direction: closed ? cardinal4(angle) : null,
  }
}

export function nearestAcrossVisibleShapes(shapes, point, maxDistance = Number.POSITIVE_INFINITY) {
  let best = null
  for (const shape of shapes) {
    if (!shape || !shape.points || shape.points.length < 2) continue
    const closed = shape.closed ?? pointsFormClosedLoop(shape.points)
    const snapped = nearestVisibleOnShape(shape.points, point, closed, maxDistance)
    if (!snapped) continue
    if (!best || snapped.distance < best.distance) {
      best = { ...snapped, shapeId: shape.id, tag: shape.tag, closed }
    }
  }
  return best
}
