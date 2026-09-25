import { Model } from './model.js'
import { SvgView } from './view.js'

export class Graph {
  constructor({ container, width, height }) {
    this.model = new Model()
    this.view = new SvgView({ model: this.model, container, width, height })

    this.model.on('node:added', (node) => this.view.renderNode(node))
    this.model.on('edge:added', (edge) => this.view.renderEdge(edge))
    this.model.on('node:moved', (node) => this.view.updateNodePosition(node))
    this.model.on('edge:changed', (edge) => this.view.renderEdge(edge))
  }

  addNode(options) {
    return this.model.addNode(options)
  }

  addEdge(options) {
    return this.model.addEdge(options)
  }

  getPortAt(x, y, radius) {
    return this.model.getPortAt(x, y, radius)
  }

  moveNode(id, x, y) {
    return this.model.moveNode(id, x, y)
  }
}
