import { readShapes } from '../../lesson13-step1/src/outline-source.js'
import { Designer as Step4Designer } from '../../lesson13-step4/src/designer.js'
import { resolveUnreadableShapes } from '../../lesson13-step4/src/outline-resolve.js'

/**
 * 13.5 只加一个开关：要不要用 getCTM 换算。
 *
 *   ignoreTransform = false（默认）→ 现在这条路的做法
 *   ignoreTransform = true         → 假装没有 getCTM，点从图形自己空间里直接拿出来用
 *                                    （这就是前 12 课的做法，只不过那时点的来源是手写 pathData）
 *
 * 两种模式走的是**同一段采样代码**，差别只在 applyCtm 那三行。
 * 把差别收成一个开关，是为了让"差多少"能被肉眼直接看见，而不是靠讲。
 */
export class Designer extends Step4Designer {
  constructor(options = {}) {
    super(options)
    this.ignoreTransform = options.ignoreTransform === true
  }

  collectShapes(materialRoot) {
    if (!this.ignoreTransform) return super.collectShapes(materialRoot)

    this.view.clearResolvedGeometry()
    const base = readShapes(materialRoot, {
      sampleCount: this.outlineOptions.sampleCount,
      preferredSelector: this.outlineOptions.outlineSelector,
      includeHidden: this.outlineOptions.includeHidden,
      ignoreTransform: true,
      decorateShape: this.decorateShape ? this.decorateShape.bind(this) : null,
    })
    // 内嵌 SVG / use / 位图那几条路不参与本次对比，保持原样（13.4 的行为）
    const resolved = resolveUnreadableShapes(materialRoot, this.view.resolvedDefs, {
      canvasWidth: this.view.width,
      canvasHeight: this.view.height,
      sampleCount: this.outlineOptions.sampleCount,
      ignoreTransform: true,
    })

    return {
      shapes: [...base.shapes, ...resolved.shapes],
      skipped: [...base.skipped, ...resolved.skipped],
      hiddenAccepted: base.hiddenAccepted ?? 0,
    }
  }

  setIgnoreTransform(value) {
    this.ignoreTransform = value === true
    return this.readOutline()
  }

  getIgnoreTransform() {
    return this.ignoreTransform
  }

  /** 当前轮廓在画布上占的范围，两边对比就靠它 */
  outlineBounds() {
    const points = this.model.outlineShapes.flatMap((shape) => shape.points)
    if (!points.length) return null
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    }
  }

  describeBounds() {
    const bounds = this.outlineBounds()
    if (!bounds) return '（没有轮廓）'
    return `x ${bounds.minX.toFixed(0)}~${bounds.maxX.toFixed(0)}   y ${bounds.minY.toFixed(0)}~${bounds.maxY.toFixed(0)}`
  }
}
