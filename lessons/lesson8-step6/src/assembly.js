import { AssemblyInteraction } from '../../lesson8-step4/src/interaction.js'
import { AssemblyModel } from '../../lesson8-step4/src/model.js'
import { AssemblyView } from './view.js'

export class Assembly {
  constructor({ container, width, height }) {
    this.model = new AssemblyModel()
    this.view = new AssemblyView(container, width, height, this.model)
    this.model.on('instance:added', (instance) => {
      this.view.renderInstance(instance, this.model.definitions.get(instance.definitionId))
    })
    this.model.on('instance:moved', (instance) => this.view.moveInstance(instance))
    this.model.on('edge:added', (edge) => this.view.renderEdge(edge))
    this.model.on('edge:changed', (edge) => this.view.renderEdge(edge))
    this.interaction = new AssemblyInteraction(this.model, this.view)
    this.interaction.enable()
  }

  addDefinition(definition) {
    return this.model.addDefinition(definition)
  }

  addInstance(definition, options) {
    const stored = this.model.definitions.get(definition.id) || this.addDefinition(definition)
    return this.model.addInstance(stored, options)
  }
}
