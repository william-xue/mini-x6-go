import { readShapes } from '../../lesson13-step1/src/outline-source.js'
import { Designer as Step3Designer } from '../../lesson13-step3/src/designer.js'
import { resolveUnreadableShapes } from './outline-resolve.js'
import { DesignerView } from './view.js'

const SOURCE_LABELS = {
  geometry: '素材里的几何图形（真外形）',
  'image-svg': '内嵌 SVG 解出来的图形（真外形）',
  'image-bbox': '位图，外接矩形近似',
  'text-bbox': '文字，外接矩形近似',
  'use-target': '被 use 引用的图形（真外形）',
  'use-bbox': 'use 解析不了，外接矩形近似',
}

/**
 * 13.4：只覆盖"形状从哪来"这一步（13.1 留的接缝）。
 * 落点、编辑、校验全部继承。
 */
export class Designer extends Step3Designer {
  constructor({ components = {}, ...options } = {}) {
    // 保留调用方注入的其它组件；只有没给 view 时才用 13.4 自己的。
    super({
      ...options,
      components: { ...components, view: components.view || DesignerView },
    })
  }

  collectShapes(materialRoot) {
    this.view.clearResolvedGeometry()

    const base = readShapes(materialRoot, {
      sampleCount: this.outlineOptions.sampleCount,
      preferredSelector: this.outlineOptions.outlineSelector,
      includeHidden: this.outlineOptions.includeHidden,
      decorateShape: this.decorateShape ? this.decorateShape.bind(this) : null,
    })

    const resolved = resolveUnreadableShapes(materialRoot, this.view.resolvedDefs, {
      canvasWidth: this.view.width,
      canvasHeight: this.view.height,
      sampleCount: this.outlineOptions.sampleCount,
    })

    return {
      shapes: [...base.shapes, ...resolved.shapes],
      skipped: [...base.skipped, ...resolved.skipped],
      hiddenAccepted: base.hiddenAccepted ?? 0,
    }
  }

  /** 开关：被祖先藏起来的辅助几何要不要收进来当落点候选 */
  setIncludeHidden(value) {
    this.outlineOptions.includeHidden = value === true
    return this.readOutline()
  }

  getIncludeHidden() {
    return this.outlineOptions.includeHidden === true
  }

  sourceLabel(shape) {
    return SOURCE_LABELS[shape.source] || shape.source || '未知来源'
  }

  /** 形状来源的统计，给 demo 的诊断面板用 */
  describeSources(report) {
    const counts = new Map()
    for (const shape of report.shapes || []) {
      const key = shape.source || 'geometry'
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return [...counts.entries()].map(([source, count]) => ({
      source,
      count,
      label: SOURCE_LABELS[source] || source,
    }))
  }
}
