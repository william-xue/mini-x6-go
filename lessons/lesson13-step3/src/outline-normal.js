// 13.3 的几何核心：把"朝外到底是哪边"从**猜**变成**推**。
//
// 13.1/13.2 沿用 7.3 那套：法线取边向量的垂线，正负靠"远离顶点平均质心"决定。
// 实测它有两个真缺陷：
//   ① 凹轮廓反向 —— 窄槽内壁正确朝外是 (+1,0)，它返回 (-1,0)（引出线往元件肚子里走）
//   ② 折线按闭合处理 —— 给开放折线补出一段"末点→首点"的幻影边，落点会吸到不存在的线上
//
// 这一版换两条依据：
//   ① 用**绕向**定法线正负 —— 只要轮廓点是按一个固定方向采样出来的，朝外就唯一确定，不需要任何质心
//   ② 开闭用**首尾两点是否重合**判定 —— 不需要读 <path> 的 Z 标记，纯几何事实

/**
 * 鞋带公式的**两倍**。符号就是绕向：
 *   > 0 → 边向量 (dx,dy) 的垂线 (dy,-dx) 指向外侧
 *   < 0 → 反过来
 * 这一点与坐标系是 y 向上还是 y 向下无关，代数上一致。
 */
export function signedAreaTwice(points) {
  let sum = 0
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    sum += a.x * b.y - b.x * a.y
  }
  return sum
}

/** 首尾两点重合 = 闭合。不需要 Z 标记，也不怕 path 用别的方式绕回来。 */
export function pointsFormClosedLoop(points, epsilon = 1e-6) {
  if (!points || points.length < 3) return false
  const first = points[0]
  const last = points[points.length - 1]
  return Math.hypot(first.x - last.x, first.y - last.y) <= epsilon
}

/**
 * 第 index 段（points[index] → points[index+1]）的外法线。
 * 闭合轮廓靠绕向定正负；开放折线没有"朝外"这个概念，返回 null（由调用方决定怎么退）。
 */
export function outwardNormal(points, index, closed = true) {
  const a = points[index]
  const b = points[(index + 1) % points.length]
  if (!a || !b) return null
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  if (!length) return null

  let normal = { x: dy / length, y: -dx / length }
  if (!closed) return normal // 开放折线：只是"边的左手垂线"这一约定，不代表朝外
  if (signedAreaTwice(points) < 0) normal = { x: -normal.x, y: -normal.y }
  return normal
}

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

export function angleOf(normal) {
  return normal ? Math.atan2(normal.y, normal.x) : null
}

const CARDINALS = [
  { direction: 'right', angle: 0 },
  { direction: 'bottom', angle: Math.PI / 2 },
  { direction: 'left', angle: Math.PI },
  { direction: 'top', angle: -Math.PI / 2 },
]

/**
 * 把连续角度收成 4 个基数方向。
 * 注意：这只是给**正交路由**用的离散档位，不是引脚朝向的真值 ——
 * 引脚朝向的真值是 angle，stem 就是沿 angle 画的，斜边上就应该是斜的。
 */
export function cardinal4(angle) {
  if (angle === null || angle === undefined || Number.isNaN(angle)) return null
  let best = CARDINALS[0]
  let bestDelta = Infinity
  for (const candidate of CARDINALS) {
    const delta = Math.abs(Math.atan2(Math.sin(angle - candidate.angle), Math.cos(angle - candidate.angle)))
    if (delta < bestDelta) {
      bestDelta = delta
      best = candidate
    }
  }
  return best.direction
}

/**
 * 折线上离 point 最近的点。
 * closed = false 时**不会**补出那段"末点 → 首点"的幻影边 —— 这是 13.1 遗留缺陷的修法。
 */
export function nearestOnShape(points, point, closed = true, maxDistance = Number.POSITIVE_INFINITY) {
  if (!points || points.length < 2) return null
  const segmentCount = closed ? points.length : points.length - 1

  let best = null
  for (let i = 0; i < segmentCount; i += 1) {
    const candidate = projectOnSegment(point, points[i], points[(i + 1) % points.length])
    if (!best || candidate.distance < best.distance) best = { ...candidate, segmentIndex: i }
  }
  if (!best || best.distance > maxDistance) return null

  const normal = outwardNormal(points, best.segmentIndex, closed)
  const angle = angleOf(normal)
  return {
    point: best.point,
    distance: best.distance,
    segmentIndex: best.segmentIndex,
    normal,
    angle,
    // 开放折线不给"朝外方向"——它两边都是外面，硬给一个是假的
    direction: closed ? cardinal4(angle) : null,
  }
}

/** 多条轮廓里谁近算谁；闭合与否按几何事实判定，不看标签。 */
export function nearestPointOnAnyShape(shapes, point, maxDistance = Number.POSITIVE_INFINITY) {
  let best = null
  for (const shape of shapes) {
    if (!shape || !shape.points || shape.points.length < 2) continue
    const closed = shape.closed ?? pointsFormClosedLoop(shape.points)
    const snapped = nearestOnShape(shape.points, point, closed, maxDistance)
    if (!snapped) continue
    if (!best || snapped.distance < best.distance) {
      best = { ...snapped, shapeId: shape.id, tag: shape.tag, closed }
    }
  }
  return best
}
