const SVG_NS = 'http://www.w3.org/2000/svg'

export function combineSelection(previous, incoming, append) {
  return append ? new Set([...previous, ...incoming]) : new Set(incoming)
}

export class SelectionOutline {
  constructor(graph) {
    this.graph = graph
    this.ids = new Set()
    this.rect = document.createElementNS(SVG_NS, 'rect')
    this.rect.setAttribute('fill', 'none')
    this.rect.setAttribute('stroke', '#f07a28')
    this.rect.setAttribute('stroke-width', 2)
    this.rect.setAttribute('pointer-events', 'none')
    this.rect.setAttribute('visibility', 'hidden')
    graph.view.root.appendChild(this.rect)
  }

  show(ids) {
    this.ids = new Set(ids)
    const nodes = [...this.ids].map((id) => this.graph.model.getNode(id)).filter(Boolean)
    if (!nodes.length) {
      this.rect.setAttribute('visibility', 'hidden')
      return
    }
    const padding = 8
    const left = Math.min(...nodes.map((node) => node.x)) - padding
    const top = Math.min(...nodes.map((node) => node.y)) - padding
    const right = Math.max(...nodes.map((node) => node.x + node.width)) + padding
    const bottom = Math.max(...nodes.map((node) => node.y + node.height)) + padding
    this.rect.setAttribute('x', left)
    this.rect.setAttribute('y', top)
    this.rect.setAttribute('width', right - left)
    this.rect.setAttribute('height', bottom - top)
    this.rect.setAttribute('visibility', 'visible')
  }
}
