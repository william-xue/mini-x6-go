// 13.2 的几何：把"能不能放""点到哪个引脚""徽标画在哪"这三件事变成纯函数。
//
// 全部与缩放无关地写在**世界坐标**里；缩放只体现为"半径除以 zoom"这一件事，
// 所以放大缩小之后视觉大小和点击手感都不变。

import { nearestAcrossShapes } from '../../lesson13-step1/src/outline-source.js'

// 尺寸基准（zoom = 1 时的世界坐标半径）
export const PIN_BASE_RADIUS = 6
export const PIN_BASE_HIT_RADIUS = 12
export const PREVIEW_BASE_RADIUS = 7
export const BADGE_BASE_RADIUS = 9
export const BADGE_BASE_OFFSET = 17
export const PIN_STEM_BASE = 18

/** 世界坐标半径 = 基准半径 / 缩放。放大后引脚不会跟着变胖，点击手感也不会漂。 */
export function worldRadius(base, zoom) {
  return base / (zoom > 0 ? zoom : 1)
}

/** 射线法：点是否在这条闭合折线内部。凹多边形也成立。 */
export function pointInPolygon(points, point) {
  if (!points || points.length < 3) return false
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i]
    const b = points[j]
    if ((a.y > point.y) === (b.y > point.y)) continue
    const crossingX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    if (point.x < crossingX) inside = !inside
  }
  return inside
}

/**
 * 能不能在这个位置放引脚。
 *
 * 13.1 用的是"离轮廓 50 个单位以内"，结果元件内部一大片点不到。
 * 13.2 换成两条规则：
 *   · 离轮廓很近（默认 8 个单位以内）→ 可以
 *   · 或者已经落在元件**内部** → 也可以（投影到最近的那条边）
 * 都不满足就不给放，避免在空白画布上凭空长出引脚。
 */
export function placementHit(shapes, point, options = {}) {
  const edgeTolerance = options.edgeTolerance ?? 8
  if (!shapes || !shapes.length) return null

  const snapped = nearestAcrossShapes(shapes, point, Number.POSITIVE_INFINITY)
  if (!snapped) return null

  const inside = shapes.some((shape) => pointInPolygon(shape.points, point))
  return {
    allowed: inside || snapped.distance <= edgeTolerance,
    inside,
    distance: snapped.distance,
    snapped,
  }
}

/** 点到了哪个引脚（世界坐标）。没有就返回 null。 */
export function pinHitTest(pins, point, radius) {
  let best = null
  for (const pin of pins) {
    const distance = Math.hypot(pin.x - point.x, pin.y - point.y)
    if (distance > radius) continue
    if (!best || distance < best.distance) best = { pin, distance }
  }
  return best ? best.pin : null
}

/** 悬停某个引脚时，删除徽标画在它的右上方。 */
export function badgeCenter(pin, zoom) {
  const offset = worldRadius(BADGE_BASE_OFFSET, zoom)
  return { x: pin.x + offset, y: pin.y - offset }
}

/**
 * 徽标的可点范围要比它画出来的圆稍大一点。
 * 否则"徽标刚冒出来、鼠标还没进去"时，指针稍微一动就判成离开引脚，
 * 徽标被收掉 → 永远点不着。
 */
export const BADGE_HIT_FACTOR = 1.4

export function badgeHitRadius(zoom) {
  return worldRadius(BADGE_BASE_RADIUS, zoom) * BADGE_HIT_FACTOR
}
