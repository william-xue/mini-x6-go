import { SvgView as Step5View } from '../../lesson5-step4/src/view.js'

export class SvgView extends Step5View {
  constructor(options) {
    super(options)
    this.selectedNodeIds = new Set()
  }

  selectNodes(ids) {
    for (const id of this.selectedNodeIds) {
      this.elements.get(id)?.children[0]?.setAttribute('stroke-width', 1)
    }
    this.selectedNodeIds = new Set(ids)
    for (const id of this.selectedNodeIds) {
      this.elements.get(id)?.children[0]?.setAttribute('stroke-width', 4)
    }
  }

  selectNode(id) {
    this.selectedNodeId = id
    this.selectNodes(id ? [id] : [])
  }
}
