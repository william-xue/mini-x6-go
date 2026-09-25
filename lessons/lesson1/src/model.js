let nextId = 1

function makeId(prefix) {
  const id = `${prefix}-${nextId}`
  nextId += 1
  return id
}

export class Node {
  constructor(options = {}) {
    this.id = options.id || makeId('node')
    this.x = options.x || 0
    this.y = options.y || 0
    this.width = options.width || 100
    this.height = options.height || 50
    this.label = options.label || this.id
  }
}

export class Edge {
  constructor(options = {}) {
    this.id = options.id || makeId('edge')
    this.source = options.source
    this.target = options.target
  }
}

export class Model {
  constructor() {
    this.nodes = new Map()
    this.edges = new Map()
    this.listeners = new Map()
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(handler)
  }

  emit(event, value) {
    for (const handler of this.listeners.get(event) || []) {
      handler(value)
    }
  }

  addNode(options) {
    const node = new Node(options)
    this.nodes.set(node.id, node)
    this.emit('node:added', node)
    return node
  }

  addEdge(options) {
    const edge = new Edge(options)
    this.edges.set(edge.id, edge)
    this.emit('edge:added', edge)
    return edge
  }

  getNode(id) {
    return this.nodes.get(id) || null
  }

  getConnectedEdges(nodeId) {
    return [...this.edges.values()].filter(
      (edge) => edge.source.cell === nodeId || edge.target.cell === nodeId,
    )
  }

  getTerminalPoint(terminal) {
    const node = this.getNode(terminal.cell)
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    }
  }

  moveNode(id, x, y) {
    const node = this.getNode(id)
    if (!node) {
      return null
    }
    node.x = x
    node.y = y
    this.emit('node:moved', node)
    for (const edge of this.getConnectedEdges(id)) {
      this.emit('edge:changed', edge)
    }
    return node
  }
}
