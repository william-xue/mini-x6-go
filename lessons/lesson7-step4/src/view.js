import { DesignerView as Step3View } from '../../lesson7-step3/src/view.js'
import { samplePath } from './path-sampling.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class DesignerView extends Step3View {
  constructor(container, width, height) {
    super(container, width, height)
    this.pathLayer = document.createElementNS(SVG_NS, 'g')
    this.pathLayer.setAttribute('data-snap-path-layer', '')
    this.root.insertBefore(this.pathLayer, this.outlineLayer)
  }

  renderOutline() {
    // 7.4 直接显示真实曲线 path，不再叠加采样折线。
  }

  renderSnapPath(pathData, step = 6) {
    this.pathLayer.replaceChildren()
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('d', pathData)
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', '#8b5cf6')
    path.setAttribute('stroke-width', 2)
    path.setAttribute('stroke-dasharray', '7 5')
    path.setAttribute('pointer-events', 'none')
    path.setAttribute('data-snap-path', '')
    this.pathLayer.appendChild(path)
    return samplePath(path, step)
  }
}
