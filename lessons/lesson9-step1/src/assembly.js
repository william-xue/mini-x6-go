import { AssemblyModel } from '../../lesson8-step4/src/model.js'
import { AssemblyView } from '../../lesson8-step6/src/view.js'
import { applyCommand, revertCommand } from './commands.js'
import { History } from './history.js'
import { AssemblyInteraction } from './interaction.js'

export class Assembly {
  constructor({ container, width, height }) {
    this.model = new AssemblyModel()
    this.view = new AssemblyView(container, width, height, this.model)
    this.history = new History({
      model: this.model,
      apply: applyCommand,
      revert: revertCommand,
    })

    this.model.on('instance:added', (instance) => {
      this.view.renderInstance(instance, this.model.definitions.get(instance.definitionId))
    })
    this.model.on('instance:moved', (instance) => this.view.moveInstance(instance))
    this.model.on('edge:added', (edge) => this.view.renderEdge(edge))
    this.model.on('edge:changed', (edge) => this.view.renderEdge(edge))

    this.interaction = new AssemblyInteraction(this.model, this.view, this.history)
    this.interaction.enable()
  }

  addDefinition(definition) {
    return this.model.addDefinition(definition)
  }

  addInstance(definition, options) {
    const stored = this.model.definitions.get(definition.id) || this.addDefinition(definition)
    return this.model.addInstance(stored, options)
  }

  undo() {
    return this.history.undo()
  }

  redo() {
    return this.history.redo()
  }
}
