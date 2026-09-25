import { DesignerInteraction } from './interaction.js'
import { DesignerModel } from './model.js'
import { DesignerView } from './view.js'

export class Designer {
  constructor({ container, width, height }) {
    this.model = new DesignerModel(width, height)
    this.view = new DesignerView(container, width, height)
    this.model.on('primitive:added', (primitive) => this.view.renderPrimitive(primitive))
    this.model.on('primitive:moved', (primitive) => this.view.movePrimitive(primitive))
    this.model.on('background:changed', (background) => this.view.renderBackground(background))
    this.model.on('outline:changed', (outline) => this.view.renderOutline(outline))
    this.model.on('pin:added', (pin) => this.view.renderPin(pin))
    this.interaction = new DesignerInteraction(this.model, this.view)
    this.interaction.enable()
  }

  setTool(tool) { this.interaction.setTool(tool) }
  setSvgBackground(name, svgText) { return this.model.setBackground(name, svgText) }
  setSnapOutline(points) { return this.model.setSnapOutline(points) }
}
