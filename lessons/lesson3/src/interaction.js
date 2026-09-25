export class Interaction {
  constructor(graph) {
    this.graph = graph
    this.root = graph.view.root
    this.dragging = null
    this.selectedNodeId = null
  }

  enable() {
    this.root.style.touchAction = 'none'
    this.root.addEventListener('pointerdown', (event) => this.pointerDown(event))
    this.root.addEventListener('pointermove', (event) => this.pointerMove(event))
    this.root.addEventListener('pointerup', (event) => this.pointerUp(event))
    this.root.addEventListener('keydown', (event) => this.keyDown(event))
    return this
  }

  getPoint(event) {
    const bounds = this.root.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * Number(this.root.getAttribute('width')) / bounds.width,
      y: (event.clientY - bounds.top) * Number(this.root.getAttribute('height')) / bounds.height,
    }
  }

  selectNode(id) {
    this.selectedNodeId = id
    this.graph.view.selectNode(id)
  }

  pointerDown(event) {
    const point = this.getPoint(event)
    const node = this.graph.getNodeAt(point.x, point.y)
    this.selectNode(node?.id || null)
    this.root.focus()
    if (!node) {
      return
    }
    this.dragging = {
      nodeId: node.id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
    }
    this.root.setPointerCapture(event.pointerId)
  }

  pointerMove(event) {
    if (!this.dragging) {
      return
    }
    const point = this.getPoint(event)
    this.graph.moveNode(
      this.dragging.nodeId,
      point.x - this.dragging.offsetX,
      point.y - this.dragging.offsetY,
    )
  }

  pointerUp(event) {
    if (!this.dragging) {
      return
    }
    this.dragging = null
    this.root.releasePointerCapture(event.pointerId)
  }

  keyDown(event) {
    const isDeleteKey = event.key === 'Delete' || event.key === 'Backspace'
    if (!isDeleteKey || !this.selectedNodeId) {
      return
    }
    this.graph.removeNode(this.selectedNodeId)
    this.selectedNodeId = null
    this.graph.view.selectNode(null)
  }
}
