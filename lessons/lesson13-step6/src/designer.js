import { Designer as Step5Designer } from '../../lesson13-step5/src/designer.js'
import { isSolidFill, markBuriedPoints } from './occlusion.js'
import { DesignerModel } from './model.js'
import { DesignerView } from './view.js'

/**
 * 13.6：只加"遮挡判定"这一层。
 *
 * 素材读进来之后、交给落点之前，先把每条轮廓上**被别的图形盖住的点**标出来（buried）。
 * 落点（13.6 的 model.snapAt）跳过这些段；画图（13.6 的 view）把它们画成浅灰。
 */
export class Designer extends Step5Designer {
  constructor({ components = {}, ignoreOcclusion = false, ...options } = {}) {
    super({
      ...options,
      components: {
        ...components,
        model: components.model || DesignerModel,
        view: components.view || DesignerView,
      },
    })
    this.ignoreOcclusion = ignoreOcclusion === true
    this.occlusionStats = null
  }

  /**
   * 13.1 留的接缝：读轮廓时顺手记下两件**只有元素身上才有**的信息。
   * 元素读完就丢，所以这两件事必须在这里取。
   */
  decorateShape(element, shape, order) {
    const view = element.ownerDocument && element.ownerDocument.defaultView
    const style = view ? view.getComputedStyle(element) : null
    return {
      // fill / opacity 都是继承来的，必须用计算值 —— 没写 fill 的元素默认是**实心黑**
      solid: isSolidFill(style),
      // 文档顺序 = SVG 的绘制顺序。用来判"谁盖在谁上面"。
      order,
    }
  }

  collectShapes(materialRoot) {
    const result = super.collectShapes(materialRoot)
    if (this.ignoreOcclusion) {
      this.occlusionStats = null
      return result
    }
    this.occlusionStats = markBuriedPoints(result.shapes)
    return result
  }

  /** 开关：关掉就退回 13.5 的行为（看不见的边照样能吸）—— 用来对比 */
  setIgnoreOcclusion(value) {
    this.ignoreOcclusion = value === true
    return this.readOutline()
  }

  getIgnoreOcclusion() {
    return this.ignoreOcclusion === true
  }

  /** 遮挡诊断：每条轮廓的点数、被埋点数、是不是实心、绘制顺序 */
  describeOcclusion() {
    const rows = []
    for (const shape of this.model.outlineShapes) {
      if (!Number.isFinite(shape.order)) continue
      rows.push({
        id: shape.id,
        tag: shape.tag,
        order: shape.order,
        solid: shape.solid === true,
        points: shape.points.length,
        buried: shape.buriedCount || 0,
      })
    }
    rows.sort((a, b) => a.order - b.order)
    return rows
  }

  occlusionSummary() {
    const rows = this.describeOcclusion()
    return {
      rows,
      buriedPoints: rows.reduce((sum, row) => sum + row.buried, 0),
      totalPoints: rows.reduce((sum, row) => sum + row.points, 0),
      occluders: rows.filter((row) => row.solid).length,
    }
  }

  /** 某条边上某个位置能不能落 —— 给 demo 做"点这里试试"用 */
  probe(point) {
    const snapped = this.model.snapAt(point)
    return snapped
      ? { ok: true, at: snapped.point, shapeId: snapped.shapeId, distance: snapped.distance }
      : { ok: false }
  }
}
