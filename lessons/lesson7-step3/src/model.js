import { DesignerModel as Step2Model } from '../../lesson7-step2/src/model.js'
import { nearestPointOnOutline } from './outline-geometry.js'

let nextPinId = 1

export class DesignerModel extends Step2Model {
  constructor(width, height) {
    super()
    this.width = width
    this.height = height
    this.snapOutline = []
    this.pins = []
  }

  setSnapOutline(points) {
    this.snapOutline = points.map((point) => ({ ...point }))
    this.emit('outline:changed', this.snapOutline)
  }

  addPinNear(point, maxDistance = 50) {
    const snapped = nearestPointOnOutline(point, this.snapOutline, maxDistance)
    if (!snapped) return null
    const pin = {
      id: `pin-${nextPinId++}`,
      x: snapped.x,
      y: snapped.y,
      u: snapped.x / this.width,
      v: snapped.y / this.height,
      direction: snapped.direction,
      normal: snapped.normal,
      segmentIndex: snapped.segmentIndex,
    }
    this.pins.push(pin)
    this.emit('pin:added', pin)
    return pin
  }
}
