import { DesignerInteraction as Step5Interaction } from '../../lesson7-step5/src/interaction.js'
import { PIN_BASE_HIT_RADIUS, badgeCenter, badgeHitRadius, worldRadius } from './pin-geometry.js'

/**
 * 13.2 的交互是一个小状态机，只在「放置引脚」工具下生效：
 *
 *   idle ──悬停到轮廓（可放）──► 预览
 *   idle ──悬停到已有引脚──────► hover（引脚变大变红 + 冒出 × 徽标）
 *   idle ──按下已有引脚────────► dragging（沿轮廓滑动）
 *   悬停到 × 徽标 ──按下──────► 删除
 *
 * 其余工具（平移 / 选择）原样交给第 7 课那套。
 */
export class DesignerInteraction extends Step5Interaction {
  constructor(model, view) {
    super(model, view)
    this.hoverPinId = null
    this.draggingPinId = null
  }

  enable() {
    super.enable()
    // 指针离开画布时把预览与徽标收掉，否则会"粘"在画布上
    this.view.root.addEventListener('pointerleave', () => {
      if (this.draggingPinId) return
      this.clearHover()
      this.view.hidePreview()
    })
  }

  pointerDown(event) {
    if (this.tool !== 'pin' || event.button === 1) {
      super.pointerDown(event)
      return
    }
    const point = this.getPoint(event)
    const zoom = this.view.viewport.zoom

    // ① 点在 × 徽标上 → 删除
    const hovered = this.hoverPinId ? this.model.getPin(this.hoverPinId) : null
    if (hovered && this.withinBadge(hovered, point, zoom)) {
      this.model.removePin(hovered.id)
      this.clearHover()
      this.view.hidePreview()
      return
    }

    // ② 点在已有引脚上 → 开始拖动
    const pin = this.model.hitPin(point, worldRadius(PIN_BASE_HIT_RADIUS, zoom))
    if (pin) {
      this.draggingPinId = pin.id
      this.view.setPinState(pin.id, 'dragging')
      this.view.hidePreview()
      this.view.hideBadge()
      this.view.root.style.cursor = 'grabbing'
      try {
        this.view.root.setPointerCapture(event.pointerId)
      } catch (error) {
        /* 指针捕获失败不该让拖动起不来（合成事件、已释放的指针等） */
      }
      return
    }

    // ③ 否则按落点规则放一个新引脚
    const placed = this.model.addPinNear(point)
    if (placed) {
      this.view.hidePreview()
      this.view.root.style.cursor = ''
    }
  }

  pointerMove(event) {
    if (this.panning || this.tool !== 'pin') {
      super.pointerMove(event)
      return
    }
    const point = this.getPoint(event)
    const zoom = this.view.viewport.zoom

    if (this.draggingPinId) {
      this.model.previewPinMove(this.draggingPinId, point)
      return
    }

    // 先看是不是停在当前徽标上。否则徽标一冒出来就被自己晃掉，永远点不着。
    const hovered = this.hoverPinId ? this.model.getPin(this.hoverPinId) : null
    if (hovered && this.withinBadge(hovered, point, zoom)) {
      this.view.hidePreview()
      return
    }

    const pin = this.model.hitPin(point, worldRadius(PIN_BASE_HIT_RADIUS, zoom))
    if (pin) {
      if (this.hoverPinId !== pin.id) this.setHover(pin.id)
      this.view.hidePreview()
      this.view.showBadge(pin)
      this.view.root.style.cursor = 'pointer'
      return
    }

    this.clearHover()
    this.view.root.style.cursor = ''

    // 预览走 model.snapAt —— 和真正落点是同一个判断。
    // （13.3 起 snapAt 换成了开闭感知 + 绕向法线的版本，这里跟着一起变，
    //   不再出现"预览在一个位置、落点在另一个位置"的不一致。）
    const snapped = typeof this.model.snapAt === 'function' ? this.model.snapAt(point) : null
    if (snapped) this.view.showPreview(snapped.point)
    else this.view.hidePreview()
  }

  pointerUp(event) {
    if (this.panning || this.tool !== 'pin') {
      super.pointerUp(event)
      return
    }
    if (this.draggingPinId) {
      const pin = this.model.getPin(this.draggingPinId)
      this.draggingPinId = null
      this.view.root.style.cursor = ''
      try {
        this.view.root.releasePointerCapture(event.pointerId)
      } catch (error) {
        /* 合成事件下 pointerId 可能没被记录，忽略 */
      }
      if (pin) {
        this.setHover(pin.id)
        this.view.showBadge(pin)
        this.model.emit('pin:committed', pin)
      }
      return
    }
    super.pointerUp(event)
  }

  withinBadge(pin, point, zoom) {
    const center = badgeCenter(pin, zoom)
    return Math.hypot(point.x - center.x, point.y - center.y) <= badgeHitRadius(zoom)
  }

  setHover(pinId) {
    this.clearHover()
    this.hoverPinId = pinId
    this.view.setPinState(pinId, 'hover')
  }

  clearHover() {
    if (this.hoverPinId) {
      this.view.setPinState(this.hoverPinId, 'idle')
      this.hoverPinId = null
    }
    this.view.hideBadge()
  }
}
