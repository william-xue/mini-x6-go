import { DesignerView as Step2View } from '../../lesson7-step2/src/view.js'
import { DesignerView as Step4View } from '../../lesson7-step4/src/view.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class DesignerView extends Step4View {
  constructor(container, width, height) {
    super(container, width, height)
    this.viewport = { x: 0, y: 0, zoom: 1 }
    this.viewportLayer = document.createElementNS(SVG_NS, 'g')
    this.viewportLayer.setAttribute('data-viewport', '')
    this.primitiveLayer = document.createElementNS(SVG_NS, 'g')
    this.viewportLayer.append(
      this.background,
      this.primitiveLayer,
      this.pathLayer,
      this.outlineLayer,
      this.pinLayer,
    )
    this.root.appendChild(this.viewportLayer)
    this.applyViewport()
  }

  renderPrimitive(primitive) {
    Step2View.prototype.renderPrimitive.call(this, primitive)
    this.primitiveLayer.appendChild(this.elements.get(primitive.id))
  }

  applyViewport() {
    const { x, y, zoom } = this.viewport
    this.viewportLayer.setAttribute('transform', `translate(${x},${y}) scale(${zoom})`)
  }
}
