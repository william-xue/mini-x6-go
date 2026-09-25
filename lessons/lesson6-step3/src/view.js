import { SvgView as Step2View } from '../../lesson6-step2/src/view.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class SvgView extends Step2View {
  constructor(options) {
    super(options)
    this.previewLayer = document.createElementNS(SVG_NS, 'g')
    this.previewLayer.setAttribute('data-multi-drag-preview', '')
    this.previewLayer.setAttribute('opacity', '0.75')
    this.root.appendChild(this.previewLayer)
  }

  startMultiPreview(ids) {
    this.previewLayer.replaceChildren()
    for (const id of ids) {
      const original = this.elements.get(id)
      const clone = original.cloneNode(true)
      clone.removeAttribute('data-node-id')
      this.previewLayer.appendChild(clone)
      original.setAttribute('visibility', 'hidden')
    }
    this.previewLayer.setAttribute('transform', 'translate(0,0)')
  }

  moveMultiPreview(dx, dy) {
    this.previewLayer.setAttribute('transform', `translate(${dx},${dy})`)
  }

  finishMultiPreview(ids) {
    this.previewLayer.replaceChildren()
    this.previewLayer.removeAttribute('transform')
    for (const id of ids) this.elements.get(id)?.setAttribute('visibility', 'visible')
  }
}
