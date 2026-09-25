import { AssemblyView as BaseView } from '../../lesson8-step4/src/view.js'
import { routeEdge } from './routing.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class AssemblyView extends BaseView {
  renderEdge(edge) {
    let polyline = this.edgeElements.get(edge.id)
    if (!polyline) {
      polyline = document.createElementNS(SVG_NS, 'polyline')
      polyline.setAttribute('fill', 'none')
      polyline.setAttribute('stroke', '#3f78ff')
      polyline.setAttribute('stroke-width', 2)
      this.edgeLayer.appendChild(polyline)
      this.edgeElements.set(edge.id, polyline)
    }

    const source = this.model.getTerminalPoint(edge.source)
    const target = this.model.getTerminalPoint(edge.target)
    const points = routeEdge(source, target)
    polyline.setAttribute('points', points.map((point) => `${point.x},${point.y}`).join(' '))
    return polyline
  }

  // 选中提示改用真实轮廓高亮：外接矩形对非矩形元件必然在四角“飘”在外面。
  selectInstance(id) {
    if (this.selectedId) {
      this.elements.get(this.selectedId)?.querySelector('[data-instance-highlight]')?.remove()
    }
    this.selectedId = id
    if (!id) return

    const instance = this.model.instances.get(id)
    const definition = instance ? this.model.definitions.get(instance.definitionId) : null
    const group = this.elements.get(id)
    if (!group || !definition || !definition.snapOutline.length) return

    const highlight = document.createElementNS(SVG_NS, 'polyline')
    highlight.setAttribute('data-instance-highlight', '')
    highlight.setAttribute('points', definition.snapOutline.map((point) => `${point.x},${point.y}`).join(' '))
    highlight.setAttribute('fill', 'none')
    highlight.setAttribute('stroke', '#f07a28')
    highlight.setAttribute('stroke-width', 2)
    highlight.setAttribute('stroke-linejoin', 'round')
    highlight.setAttribute('vector-effect', 'non-scaling-stroke')
    highlight.setAttribute('pointer-events', 'none')
    group.appendChild(highlight)
  }
}
