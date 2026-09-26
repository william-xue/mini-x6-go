import { DesignerModel as Step3Model } from '../../lesson13-step3/src/model.js'
import { pointInPolygon } from '../../lesson13-step2/src/pin-geometry.js'
import { nearestAcrossVisibleShapes } from './visible-outline.js'

/**
 * 13.6：只覆盖 `snapAt` 这一个口子。
 *
 * 放引脚、拖动、悬停预览三个动作全都走它（13.3 已经把它们收口到 snapAt，
 * 13.2 的交互层预览也改成了调 model.snapAt），所以一处改动，三处生效。
 */
export class DesignerModel extends Step3Model {
  snapAt(point, options = {}) {
    const shapes = this.outlineShapes
    if (!shapes.length) return null

    // 唯一的改动：最近点只在**看得见的那些段**上找
    const snapped = nearestAcrossVisibleShapes(shapes, point, Number.POSITIVE_INFINITY)
    if (!snapped) return null

    // "点在元件内部"仍然按**完整轮廓**判 —— 被盖住的部分也是元件的实体区域，
    // 用户点在元件里面想让引脚贴到最近的可落边上，这个意图不该因为遮挡判定被打消
    const inside = shapes.some((shape) => pointInPolygon(shape.points, point))
    const tolerance = options.edgeTolerance ?? 8
    if (!inside && snapped.distance > tolerance) return null
    return snapped
  }
}
