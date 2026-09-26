import { Designer as Step1Designer } from '../../lesson13-step1/src/designer.js'
import { DesignerInteraction } from './interaction.js'
import { DesignerModel } from './model.js'
import { DesignerView } from './view.js'

/**
 * 13.2 只换三件东西：model / view / interaction。
 * 读素材轮廓那一整套（13.1）原样继承，不复制。
 */
export class Designer extends Step1Designer {
  constructor({ components = {}, ...options } = {}) {
    super({
      ...options,
      components: {
        model: components.model || DesignerModel,
        view: components.view || DesignerView,
        interaction: components.interaction || DesignerInteraction,
      },
    })

    // 13.2 新增的事件线：删、改、拖动
    this.model.on('pin:removed', (pin) => this.view.removePin(pin.id))
    this.model.on('pin:changed', (pin) => this.view.updatePin(pin))
    this.model.on('pin:moved', (pin) => this.view.updatePin(pin))
  }

  /** 当前所有引脚的快照（demo 的状态栏与验收用） */
  pinSnapshot() {
    return this.model.pins.map((pin) => ({
      id: pin.id,
      x: Math.round(pin.x * 100) / 100,
      y: Math.round(pin.y * 100) / 100,
      shapeId: pin.shapeId,
      direction: pin.direction,
    }))
  }
}
