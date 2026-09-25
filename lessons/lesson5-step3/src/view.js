import { SvgView as Step1View } from '../../lesson5-step1/src/view.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class SvgView extends Step1View {
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
    const points = [
      this.model.getTerminalPoint(edge.source),
      ...edge.vertices,
      this.model.getTerminalPoint(edge.target),
    ]
    polyline.setAttribute('points', points.map((point) => `${point.x},${point.y}`).join(' '))
    return polyline
  }
}
