import { DesignerInteraction as Step1Interaction } from '../../lesson7-step1/src/interaction.js'

export class DesignerInteraction extends Step1Interaction {
  constructor(model, view) {
    super(model, view)
    this.tool = 'select'
  }

  setTool(tool) {
    this.tool = tool
  }

  pointerDown(event) {
    if (this.tool !== 'pin') {
      super.pointerDown(event)
      return
    }
    const point = this.getPoint(event)
    this.model.addPinNear(point)
  }
}
