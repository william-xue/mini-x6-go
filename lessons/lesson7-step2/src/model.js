import { DesignerModel as Step1Model } from '../../lesson7-step1/src/model.js'

export class DesignerModel extends Step1Model {
  constructor() {
    super()
    this.background = null
  }

  setBackground(name, svgText) {
    this.background = { name, svgText }
    this.emit('background:changed', this.background)
    return this.background
  }
}
