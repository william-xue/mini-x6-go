const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
  return element
}

export class DesignerView {
  constructor(container, width = 868, height = 420) {
    this.root = svg('svg', { width, height, tabindex: 0 })
    container.appendChild(this.root)
    this.elements = new Map()
    this.selectedId = null
  }

  renderPrimitive(primitive) {
    const group = svg('g', { 'data-primitive-id': primitive.id })
    const common = { fill: '#eef3ff', stroke: '#3f78ff', 'stroke-width': 2 }
    const shapes = {
      rect: () => svg('rect', { width: primitive.width, height: primitive.height, ...common }),
      circle: () => svg('circle', { r: primitive.r, ...common }),
      ellipse: () => svg('ellipse', { rx: primitive.rx, ry: primitive.ry, ...common }),
      line: () => svg('line', { x2: primitive.endX, y2: primitive.endY, stroke: '#3f78ff', 'stroke-width': 4 }),
    }
    group.appendChild(shapes[primitive.kind]())
    this.root.appendChild(group)
    this.elements.set(primitive.id, group)
    this.movePrimitive(primitive)
  }

  movePrimitive(primitive) {
    this.elements.get(primitive.id).setAttribute('transform', `translate(${primitive.x},${primitive.y})`)
  }

  select(id) {
    if (this.selectedId) this.elements.get(this.selectedId)?.children[0]?.setAttribute('stroke', '#3f78ff')
    this.selectedId = id
    if (id) this.elements.get(id).children[0].setAttribute('stroke', '#f07a28')
  }
}
