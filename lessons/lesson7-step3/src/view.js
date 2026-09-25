import { DesignerView as Step2View } from '../../lesson7-step2/src/view.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class DesignerView extends Step2View {
  constructor(container, width, height) {
    super(container, width, height)
    this.outlineLayer = document.createElementNS(SVG_NS, 'g')
    this.pinLayer = document.createElementNS(SVG_NS, 'g')
    this.root.append(this.outlineLayer, this.pinLayer)
  }

  renderPrimitive(primitive) {
    super.renderPrimitive(primitive)
    this.root.insertBefore(this.elements.get(primitive.id), this.outlineLayer)
  }

  renderOutline(points) {
    this.outlineLayer.replaceChildren()
    const polygon = document.createElementNS(SVG_NS, 'polygon')
    polygon.setAttribute('points', points.map((point) => `${point.x},${point.y}`).join(' '))
    polygon.setAttribute('fill', 'none')
    polygon.setAttribute('stroke', '#8b5cf6')
    polygon.setAttribute('stroke-width', 2)
    polygon.setAttribute('stroke-dasharray', '7 5')
    polygon.setAttribute('pointer-events', 'none')
    polygon.setAttribute('data-snap-outline', '')
    this.outlineLayer.appendChild(polygon)
  }

  renderPin(pin) {
    const group = document.createElementNS(SVG_NS, 'g')
    group.setAttribute('data-pin-id', pin.id)
    group.setAttribute('data-direction', pin.direction)
    const normal = document.createElementNS(SVG_NS, 'line')
    normal.setAttribute('x1', pin.x)
    normal.setAttribute('y1', pin.y)
    normal.setAttribute('x2', pin.x + pin.normal.x * 22)
    normal.setAttribute('y2', pin.y + pin.normal.y * 22)
    normal.setAttribute('stroke', '#f07a28')
    normal.setAttribute('stroke-width', 3)
    const circle = document.createElementNS(SVG_NS, 'circle')
    circle.setAttribute('cx', pin.x)
    circle.setAttribute('cy', pin.y)
    circle.setAttribute('r', 6)
    circle.setAttribute('fill', '#ffffff')
    circle.setAttribute('stroke', '#f07a28')
    circle.setAttribute('stroke-width', 3)
    group.append(normal, circle)
    this.pinLayer.appendChild(group)
  }
}
