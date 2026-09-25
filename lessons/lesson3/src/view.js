const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value)
  }
  return element
}

export class SvgView {
  constructor({ model, container, width = 800, height = 500 }) {
    this.model = model
    this.root = svg('svg', { width, height, tabindex: 0 })
    this.edgeLayer = svg('g')
    this.nodeLayer = svg('g')
    this.root.append(this.edgeLayer, this.nodeLayer)
    container.appendChild(this.root)
    this.elements = new Map()
    this.selectedNodeId = null
  }

  renderNode(node) {
    let group = this.elements.get(node.id)
    if (!group) {
      group = svg('g', { 'data-node-id': node.id })
      group.append(svg('rect', { rx: 6, fill: '#eef3ff', stroke: '#3f78ff' }))
      group.append(svg('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' }))
      for (const port of node.ports) {
        group.append(svg('circle', {
          cx: node.width * port.x,
          cy: node.height * port.y,
          r: 7,
          fill: '#ffffff',
          stroke: '#f07a28',
          'stroke-width': 3,
          'data-port-id': port.id,
          'data-direction': port.direction,
        }))
      }
      this.nodeLayer.appendChild(group)
      this.elements.set(node.id, group)
    }

    group.setAttribute('transform', `translate(${node.x},${node.y})`)
    const rect = group.children[0]
    rect.setAttribute('width', node.width)
    rect.setAttribute('height', node.height)
    const text = group.children[1]
    text.setAttribute('x', node.width / 2)
    text.setAttribute('y', node.height / 2)
    text.textContent = node.label
    return group
  }

  updateNodePosition(node) {
    const group = this.elements.get(node.id)
    group.setAttribute('transform', `translate(${node.x},${node.y})`)
    return group
  }

  renderEdge(edge) {
    let line = this.elements.get(edge.id)
    if (!line) {
      line = svg('line', { stroke: '#3f78ff', 'stroke-width': 2 })
      this.edgeLayer.appendChild(line)
      this.elements.set(edge.id, line)
    }

    const source = this.model.getTerminalPoint(edge.source)
    const target = this.model.getTerminalPoint(edge.target)
    if (!source || !target) {
      line.setAttribute('visibility', 'hidden')
      line.setAttribute('data-invalid', 'true')
      return line
    }

    line.setAttribute('visibility', 'visible')
    line.setAttribute('data-invalid', 'false')
    line.setAttribute('x1', source.x)
    line.setAttribute('y1', source.y)
    line.setAttribute('x2', target.x)
    line.setAttribute('y2', target.y)
    return line
  }

  selectNode(id) {
    if (this.selectedNodeId) {
      const oldRect = this.elements.get(this.selectedNodeId)?.children[0]
      oldRect?.setAttribute('stroke-width', 1)
    }
    this.selectedNodeId = id
    if (id) {
      this.elements.get(id).children[0].setAttribute('stroke-width', 4)
    }
  }

  removeNode(node) {
    this.elements.get(node.id).remove()
    this.elements.delete(node.id)
  }

  removeEdge(edge) {
    this.elements.get(edge.id).remove()
    this.elements.delete(edge.id)
  }
}
