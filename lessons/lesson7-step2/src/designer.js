import { DesignerInteraction } from '../../lesson7-step1/src/interaction.js'
import { DesignerModel } from './model.js'
import { DesignerView } from './view.js'

export class Designer {
  constructor({ container, width, height }) {
    this.model = new DesignerModel()
    this.view = new DesignerView(container, width, height)
    this.model.on('primitive:added', (primitive) => this.view.renderPrimitive(primitive))
    this.model.on('primitive:moved', (primitive) => this.view.movePrimitive(primitive))
    this.model.on('background:changed', (background) => this.view.renderBackground(background))
    this.interaction = new DesignerInteraction(this.model, this.view)
    this.interaction.enable()
  }

  addPrimitive(kind, x, y) {
    return this.model.addPrimitive(kind, x, y)
  }

  setSvgBackground(name, svgText) {
    return this.model.setBackground(name, svgText)
  }

  async loadSvgFile(file) {
    return this.setSvgBackground(file.name, await file.text())
  }
}
