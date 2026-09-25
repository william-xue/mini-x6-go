import { SvgView as Step1View } from '../../lesson6-step1/src/view.js'

export class SvgView extends Step1View {
  selectNodes(ids) {
    for (const id of this.selectedNodeIds) {
      this.elements.get(id)?.children[0]?.setAttribute('stroke-width', 1)
    }
    this.selectedNodeIds = new Set(ids)
  }
}
