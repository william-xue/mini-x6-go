import { DesignerView as Step1View } from '../../lesson7-step1/src/view.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class DesignerView extends Step1View {
  constructor(container, width, height) {
    super(container, width, height)
    this.background = document.createElementNS(SVG_NS, 'image')
    this.background.setAttribute('width', width)
    this.background.setAttribute('height', height)
    this.background.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    this.background.setAttribute('pointer-events', 'none')
    this.background.setAttribute('data-svg-background', '')
    this.root.prepend(this.background)
  }

  renderBackground(background) {
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(background.svgText)}`
    this.background.setAttribute('href', dataUrl)
    this.background.setAttribute('data-name', background.name)
  }
}
