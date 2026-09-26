import { Designer as Step2Designer } from '../../lesson13-step2/src/designer.js'
import { toDefinition } from './definition.js'
import { DesignerModel } from './model.js'
import { DesignerView } from './view.js'

/**
 * 13.3：只换 model / view。
 * 交互状态机（预览 / hover / 拖动 / 删除）与 13.2 完全一样，原样继承。
 */
export class Designer extends Step2Designer {
  constructor({ components = {}, ...options } = {}) {
    super({
      ...options,
      components: {
        model: components.model || DesignerModel,
        view: components.view || DesignerView,
        interaction: components.interaction,
      },
    })
  }

  /** 把当前设计导成"带身份"的元件定义 */
  toDefinition(name, extras = {}) {
    return toDefinition(this.model, name, extras)
  }

  /** 引脚快照（列表 UI 与验收用），比 13.2 多了 name / kind / angle */
  pinSnapshot() {
    return this.model.pins.map((pin) => ({
      id: pin.id,
      name: pin.name,
      kind: pin.kind,
      x: Math.round(pin.x * 100) / 100,
      y: Math.round(pin.y * 100) / 100,
      direction: pin.direction,
      angle: pin.angle === null ? null : Math.round((pin.angle * 180) / Math.PI),
      closed: pin.closed,
      shapeId: pin.shapeId,
    }))
  }

  renamePin(pinId, name) {
    return this.model.updatePin(pinId, { name })
  }

  setPinKind(pinId, kind) {
    return this.model.updatePin(pinId, { kind })
  }
}
