export class Interaction {
  constructor(graph, options = {}) {
    this.graph = graph
    this.root = graph.view.root
    this.dragging = null
    this.connecting = null
    this.selectedNodeId = null
    this.snapRadius = options.snapRadius || 12
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
    const port = this.graph.getPortAt(point.x, point.y)
    this.root.focus()
    if (port) {
      const start = this.graph.model.getPortPoint(port.nodeId, port.portId)
      this.connecting = {
        source: { cell: port.nodeId, port: port.portId },
        from: { x: start.x, y: start.y },
        current: point,
      }
      this.graph.view.showTempLine(this.connecting.from, point)
      this.root.setPointerCapture(event.pointerId)
      return
    }
    const node = this.graph.getNodeAt(point.x, point.y)
    this.selectNode(node?.id || null)
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
    const point = this.getPoint(event)
    if (this.connecting) {
      this.connecting.current = point
      this.graph.view.showTempLine(this.connecting.from, point)
      return
    }
    if (!this.dragging) {
      return
    }
    this.graph.moveNode(
      this.dragging.nodeId,
      point.x - this.dragging.offsetX,
      point.y - this.dragging.offsetY,
    )
  }

  pointerUp(event) {
    if (this.connecting) {
      const connecting = this.connecting
      this.connecting = null
      this.graph.view.hideTempLine()
      this.root.releasePointerCapture(event.pointerId)
      const point = this.getPoint(event)
      const exclude = { nodeId: connecting.source.cell, portId: connecting.source.port }
      const snap = this.graph.getNearestPort(point.x, point.y, this.snapRadius, exclude)
      if (snap) {
        this.graph.addEdge({
          source: connecting.source,
          target: { cell: snap.nodeId, port: snap.portId },
        })
        return
      }
      const moved = Math.hypot(point.x - connecting.from.x, point.y - connecting.from.y)
      if (moved < 5) {
        return
      }
      this.graph.addEdge({
        source: connecting.source,
        target: { x: point.x, y: point.y },
      })
      return
    }
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
