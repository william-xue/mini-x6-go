import { DesignerView as Step5View } from '../../lesson7-step5/src/view.js'
import { mountMaterial, parseMaterial, unmountMaterial } from './material.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class DesignerView extends Step5View {
  constructor(container, width, height) {
    super(container, width, height)
    this.width = width
    this.height = height

    // 素材的几何挂在这里：不渲染、不占位、不挡点击，但浏览器肯算它的长度和坐标。
    // 注意它挂在 root 上（在 viewportLayer 之外），所以 getCTM 给出的就是"画布坐标"。
    this.materialDefs = document.createElementNS(SVG_NS, 'defs')
    this.materialDefs.setAttribute('data-material-layer', '')
    this.root.appendChild(this.materialDefs)
    this.materialRoot = null

    // 读出来的候选轮廓画在这一层（跟着视口一起缩放）
    this.shapeLayer = document.createElementNS(SVG_NS, 'g')
    this.shapeLayer.setAttribute('data-shape-layer', '')
    this.viewportLayer.insertBefore(this.shapeLayer, this.outlineLayer)
  }

  mountMaterialGeometry(svgText) {
    const { error, root } = parseMaterial(svgText)
    if (error) {
      unmountMaterial(this.materialDefs)
      this.materialRoot = null
      return { error, root: null, viewBox: null }
    }
    this.materialRoot = mountMaterial(this.materialDefs, root, {
      width: this.width,
      height: this.height,
    })
    return {
      error: null,
      root: this.materialRoot,
      viewBox: this.materialRoot.getAttribute('viewBox'),
    }
  }

  /**
   * 把每条候选轮廓画成虚线，主轮廓加粗换色。
   * 这是 13.1 唯一的可视证据：屏幕上那张图是 <image>，轮廓是这里画出来的，
   * 两者对不上就一眼能看出来。
   */
  renderShapeOutlines(shapes, primaryId) {
    this.shapeLayer.replaceChildren()
    for (const shape of shapes) {
      const outline = document.createElementNS(SVG_NS, 'polyline')
      outline.setAttribute('points', shape.points.map((point) => `${point.x},${point.y}`).join(' '))
      outline.setAttribute('fill', 'none')
      outline.setAttribute('stroke', shape.id === primaryId ? '#8b5cf6' : '#c3b1f0')
      outline.setAttribute('stroke-width', shape.id === primaryId ? 2.5 : 1.5)
      outline.setAttribute('stroke-dasharray', '7 5')
      outline.setAttribute('stroke-linejoin', 'round')
      outline.setAttribute('vector-effect', 'non-scaling-stroke')
      outline.setAttribute('pointer-events', 'none')
      outline.setAttribute('data-shape-id', shape.id)
      this.shapeLayer.appendChild(outline)
    }
  }

  clearShapeOutlines() {
    this.shapeLayer.replaceChildren()
  }

  /** 只清画面上的引脚，轮廓不动 */
  clearPins() {
    this.pinLayer.replaceChildren()
  }
}
