import { SvgView as Step3View } from '../../lesson5-step3/src/view.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class SvgView extends Step3View {
  renderEdge(edge) {
    let polyline = this.elements.get(edge.id)
    if (!polyline) {
      polyline = document.createElementNS(SVG_NS, 'polyline')
      polyline.setAttribute('fill', 'none')
      polyline.setAttribute('stroke', '#3f78ff')
      polyline.setAttribute('stroke-width', 2)
      this.edgeLayer.appendChild(polyline)
      this.elements.set(edge.id, polyline)
    }
    const points = this.model.getEdgePoints(edge)
    polyline.setAttribute('points', points.map((point) => `${point.x},${point.y}`).join(' '))
    return polyline
  }
}
