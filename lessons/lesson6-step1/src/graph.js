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
    this.model.on('edge:removed', (edge) => this.view.removeEdge(edge))
    this.model.on('node:removed', (node) => this.view.removeNode(node))
  }
  addNode(options) { return this.model.addNode(options) }
  addEdge(options) { return this.model.addEdge(options) }
  getNodeAt(x, y) { return this.model.getNodeAt(x, y) }
  getEdgeAt(x, y, tolerance) { return this.model.getEdgeAt(x, y, tolerance) }
  getPortAt(x, y, radius) { return this.model.getPortAt(x, y, radius) }
  getNearestPort(x, y, radius, exclude) { return this.model.getNearestPort(x, y, radius, exclude) }
  moveNode(id, x, y) { return this.model.moveNode(id, x, y) }
  removeNode(id) { return this.model.removeNode(id) }
  removeEdge(id) { return this.model.removeEdge(id) }
}
