import { DesignerModel as Step2Model } from '../../lesson13-step2/src/model.js'
import { pointInPolygon } from '../../lesson13-step2/src/pin-geometry.js'
import { nearestPointOnAnyShape } from './outline-normal.js'

let nextPinId = 1
let nextPinNumber = 1

export class DesignerModel extends Step2Model {
  /** 所有落点都走这一个口子：开闭感知 + 绕向法线 */
  snapAt(point, options = {}) {
    const shapes = this.outlineShapes
    if (!shapes.length) return null
    const snapped = nearestPointOnAnyShape(shapes, point, Number.POSITIVE_INFINITY)
    if (!snapped) return null
    const inside = shapes.some((shape) => pointInPolygon(shape.points, point))
    const tolerance = options.edgeTolerance ?? 8
    if (!inside && snapped.distance > tolerance) return null
    return snapped
  }

  addPinNear(point, options = {}) {
    const snapped = this.snapAt(point, options)
    if (!snapped) return null
    return this.commitPin(this.createPin(snapped))
  }

  movePin(pinId, point) {
    const pin = this.getPin(pinId)
    const snapped = this.snapAt(point)
    if (!pin || !snapped) return null
    this.assignSnap(pin, snapped)
    this.emit('pin:changed', pin)
    return pin
  }

  previewPinMove(pinId, point) {
    const pin = this.getPin(pinId)
    const snapped = this.snapAt(point)
    if (!pin || !snapped) return null
    this.assignSnap(pin, snapped)
    this.emit('pin:moved', pin)
    return pin
  }

  /** 改名 / 改类型（13.3 的核心动作） */
  updatePin(pinId, patch) {
    const pin = this.getPin(pinId)
    if (!pin) return null
    Object.assign(pin, patch)
    this.emit('pin:changed', pin)
    return pin
  }

  assignSnap(pin, snapped) {
    Object.assign(pin, {
      x: snapped.point.x,
      y: snapped.point.y,
      u: snapped.point.x / this.width,
      v: snapped.point.y / this.height,
      normal: snapped.normal,
      angle: snapped.angle,
      direction: snapped.direction,
      closed: snapped.closed,
      segmentIndex: snapped.segmentIndex,
      shapeId: snapped.shapeId,
      shapeTag: snapped.tag,
    })
  }

  createPin(snapped) {
    const pin = {
      id: `pin-${nextPinId++}`,
      name: `P${nextPinNumber++}`,
      kind: 'bidirectional',
      x: snapped.point.x,
      y: snapped.point.y,
      u: snapped.point.x / this.width,
      v: snapped.point.y / this.height,
      normal: snapped.normal,
      angle: snapped.angle,
      direction: snapped.direction,
      closed: snapped.closed,
      segmentIndex: snapped.segmentIndex,
      shapeId: snapped.shapeId,
      shapeTag: snapped.tag,
    }
    return pin
  }
}
