import { Model as Step5Model } from '../../lesson5-step4/src/model.js'

export class Model extends Step5Model {
  getNodesInRect(rect) {
    const right = rect.x + rect.width
    const bottom = rect.y + rect.height
    return [...this.nodes.values()].filter((node) => (
      node.x + node.width >= rect.x
      && node.x <= right
      && node.y + node.height >= rect.y
      && node.y <= bottom
    ))
  }
}

export { Node, Edge } from '../../lesson5-step4/src/model.js'
