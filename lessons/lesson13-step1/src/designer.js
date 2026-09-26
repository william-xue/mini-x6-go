import { DesignerInteraction } from '../../lesson7-step5/src/interaction.js'
import { zoomAt } from '../../lesson7-step5/src/viewport-math.js'
import { DesignerModel } from './model.js'
import { DesignerView } from './view.js'
import { isBackgroundLike, pickPrimaryShape, readShapes } from './outline-source.js'

export class Designer {
  constructor({ container, width, height, outline = {}, components = {} }) {
    this.outlineOptions = {
      sampleCount: outline.sampleCount ?? 240,
      ignoreBackground: outline.ignoreBackground ?? true,
      outlineSelector: outline.outlineSelector ?? null,
      includeHidden: outline.includeHidden ?? false,
    }

    // 接缝：后续小课（13.2 起）把自己那套 model / view / interaction 替进来，
    // 这样 13.1 读轮廓的那套逻辑不用被复制一遍。
    const Model = components.model || DesignerModel
    const View = components.view || DesignerView
    const Interaction = components.interaction || DesignerInteraction

    this.model = new Model(width, height)
    this.view = new View(container, width, height)

    this.model.on('primitive:added', (primitive) => this.view.renderPrimitive(primitive))
    this.model.on('primitive:moved', (primitive) => this.view.movePrimitive(primitive))
    this.model.on('background:changed', (background) => this.view.renderBackground(background))
    this.model.on('pin:added', (pin) => this.view.renderPin(pin))
    this.model.on('pins:cleared', () => this.view.clearPins())

    this.interaction = new Interaction(this.model, this.view)
    this.interaction.enable()

    this.outlineReport = null
  }

  setTool(tool) {
    this.interaction.setTool(tool)
  }

  /**
   * 素材一换，轮廓就跟着换 —— 13.1 与前 12 课的全部差别就在这一行。
   * 前 12 课：素材显示归显示，轮廓要人另外写一条 pathData 喂进来。
   */
  setSvgBackground(name, svgText) {
    const background = this.model.setBackground(name, svgText)
    this.readOutline()
    return background
  }

  /** 手动覆盖：想自己指定轮廓时仍然可以，接口与 7.5 相同。 */
  setSnapPath(pathData, step = 6) {
    const points = this.view.renderSnapPath(pathData, step)
    this.model.setOutlineShapes([{ id: 'manual', tag: 'path', length: points.length, step, points }])
    this.view.renderShapeOutlines(this.model.outlineShapes, 'manual')
    this.outlineReport = {
      ok: true,
      error: null,
      viewBox: null,
      manual: true,
      shapes: [{ id: 'manual', tag: 'path', length: points.length, step, pointCount: points.length, primary: true }],
      backgrounds: [],
      skipped: [],
    }
    this.model.outlineReport = this.outlineReport
    this.model.emit('outline:read', this.outlineReport)
    return points
  }

  /**
   * 读轮廓的"形状来源"这一步，单独抽出来当接缝。
   * 13.4 会覆盖它，把 `<image>` / `<text>` / `<use>` 这些"浏览器没有几何 API"的
   * 也解析成可落点的轮廓，其余逻辑不动。
   */
  collectShapes(materialRoot) {
    return readShapes(materialRoot, {
      sampleCount: this.outlineOptions.sampleCount,
      preferredSelector: this.outlineOptions.outlineSelector,
      includeHidden: this.outlineOptions.includeHidden,
      // 13.6 的接缝：子类可以在这里给每个形状附加"从元素身上读到的"信息
      decorateShape: this.decorateShape ? this.decorateShape.bind(this) : null,
    })
  }

  /** 把当前素材再读一遍轮廓，返回诊断报告。 */
  readOutline() {
    const background = this.model.background
    if (!background) {
      this.outlineReport = emptyReport('还没有素材')
      return this.outlineReport
    }

    const mounted = this.view.mountMaterialGeometry(background.svgText)
    if (mounted.error) {
      this.view.clearShapeOutlines()
      this.model.setOutlineShapes([])
      this.outlineReport = emptyReport(mounted.error)
      this.model.emit('outline:read', this.outlineReport)
      return this.outlineReport
    }

    const { shapes: read, skipped, hiddenAccepted } = this.collectShapes(mounted.root)

    // 通铺底色不是引脚该落的地方，先从候选里摘出去，但在报告里如实记名
    const backgrounds = this.outlineOptions.ignoreBackground
      ? read.filter((shape) => isBackgroundLike(shape, this.view.width, this.view.height))
      : []
    const candidates = read.filter((shape) => !backgrounds.includes(shape))

    // 主轮廓：手工指定的优先，否则取围出面积最大的那条
    const primary = candidates.find((shape) => shape.selected) || pickPrimaryShape(candidates)
    const ordered = primary
      ? [primary, ...candidates.filter((shape) => shape !== primary)]
      : candidates

    this.model.setOutlineShapes(ordered)
    this.view.renderShapeOutlines(ordered, primary ? primary.id : null)

    this.outlineReport = {
      ok: true,
      error: null,
      viewBox: mounted.viewBox,
      manual: false,
      hiddenAccepted: hiddenAccepted ?? 0,
      shapes: ordered.map((shape) => ({
        id: shape.id,
        tag: shape.tag,
        length: shape.length,
        step: shape.step,
        pointCount: shape.points.length,
        primary: shape === primary,
        hidden: shape.hidden === true,
        source: shape.source || 'geometry',
        approximate: shape.approximate === true,
      })),
      backgrounds: backgrounds.map((shape) => ({ id: shape.id, tag: shape.tag })),
      skipped,
    }
    this.model.outlineReport = this.outlineReport
    this.model.emit('outline:read', this.outlineReport)
    return this.outlineReport
  }

  /** 清空所有引脚（真正的"逐个删除"是 13.2） */
  clearPins() {
    this.model.clearPins()
  }

  zoomBy(factor) {
    const { zoom, x, y } = this.view.viewport
    const screen = {
      x: (this.model.width / 2) * zoom + x,
      y: (this.model.height / 2) * zoom + y,
    }
    this.view.viewport = zoomAt(screen, this.view.viewport, factor)
    this.view.applyViewport()
    return this.view.viewport
  }
}

function emptyReport(error) {
  return { ok: false, error, viewBox: null, manual: false, shapes: [], backgrounds: [], skipped: [] }
}
