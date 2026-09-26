import { AssemblyModel } from '../../lesson8-step4/src/model.js'
import { AssemblyView } from '../../lesson8-step6/src/view.js'
import { ConnectingInteraction } from './assembly-interaction.js'

/**
 * 装配画布：模型与视图沿用第 8 课（第 8.6 课那一版带正交走线与轮廓高亮），
 * 只把交互换成"先校验再连线"的那一个。
 */
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

    this.interaction = new ConnectingInteraction(this.model, this.view)
    this.interaction.enable()
  }

  onConnectionResult(handler) {
    this.interaction.onResult = handler
  }

  addDefinition(definition) {
    return this.model.addDefinition(definition)
  }

  addInstance(definition, options) {
    const stored = this.model.definitions.get(definition.id) || this.addDefinition(definition)
    return this.model.addInstance(stored, options)
  }
}
