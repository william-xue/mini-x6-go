import { DesignerModel as Step1Model } from '../../lesson13-step1/src/model.js'
import { placementHit } from './pin-geometry.js'

let nextPinId = 1

export class DesignerModel extends Step1Model {
  /**
   * 落点决策的**唯一出口**：返回 snapped（可以放）或 null（不可以）。
   *
   * 13.3 会覆盖它（换成开闭感知 + 绕向法线），13.6 也会覆盖它（跳过被埋起来的边）。
   * 交互层的那圈"悬停预览"走的也是这里 —— 这样预览和真正落点永远是同一个判断。
   */
  snapAt(point, options = {}) {
    const placement = placementHit(this.outlineShapes, point, options)
    return placement && placement.allowed ? placement.snapped : null
  }

  /**
   * 放引脚。落点规则换成"贴边或者落在元件内部"（见 pin-geometry 的 placementHit），
   * 不再用 13.1 那个 50 个单位的硬阈值。
   */
  addPinNear(point, options = {}) {
    const snapped = this.snapAt(point, options)
    if (!snapped) return null
    return this.commitPin(this.createPin(snapped))
  }

  /** 拖动引脚：把指针位置重新投影到轮廓上，不允许拖离轮廓。 */
  movePin(pinId, point) {
    const pin = this.pins.find((item) => item.id === pinId)
    if (!pin) return null
    const placement = placementHit(this.outlineShapes, point)
    if (!placement) return null

    const snapped = placement.snapped
    Object.assign(pin, {
      x: snapped.point.x,
      y: snapped.point.y,
      u: snapped.point.x / this.width,
      v: snapped.point.y / this.height,
      direction: snapped.direction,
      normal: snapped.normal,
      segmentIndex: snapped.segmentIndex,
      shapeId: snapped.shapeId,
      shapeTag: snapped.tag,
    })
    this.emit('pin:changed', pin)
    return pin
  }

  removePin(pinId) {
    const index = this.pins.findIndex((item) => item.id === pinId)
    if (index < 0) return null
    const [removed] = this.pins.splice(index, 1)
    this.emit('pin:removed', removed)
    return removed
  }

  getPin(pinId) {
    return this.pins.find((item) => item.id === pinId) || null
  }

  hitPin(point, radius) {
    let best = null
    for (const pin of this.pins) {
      const distance = Math.hypot(pin.x - point.x, pin.y - point.y)
      if (distance > radius) continue
      if (!best || distance < best.distance) best = { pin, distance }
    }
    return best ? best.pin : null
  }

  /** 拖动过程中只改数据、不发"新引脚"事件；松手才由 interaction 发一次 pin:changed。 */
  previewPinMove(pinId, point) {
    const pin = this.getPin(pinId)
    if (!pin) return null
    const placement = placementHit(this.outlineShapes, point)
    if (!placement) return null
    const snapped = placement.snapped
    pin.x = snapped.point.x
    pin.y = snapped.point.y
    pin.u = snapped.point.x / this.width
    pin.v = snapped.point.y / this.height
    pin.direction = snapped.direction
    pin.normal = snapped.normal
    pin.segmentIndex = snapped.segmentIndex
    pin.shapeId = snapped.shapeId
    pin.shapeTag = snapped.tag
    this.emit('pin:moved', pin)
    return pin
  }

  createPin(snapped) {
    return {
      id: `pin-${nextPinId++}`,
      x: snapped.point.x,
      y: snapped.point.y,
      u: snapped.point.x / this.width,
      v: snapped.point.y / this.height,
      direction: snapped.direction,
      normal: snapped.normal,
      segmentIndex: snapped.segmentIndex,
      shapeId: snapped.shapeId,
      shapeTag: snapped.tag,
    }
  }

  commitPin(pin) {
    this.pins.push(pin)
    this.emit('pin:added', pin)
    return pin
  }
}
