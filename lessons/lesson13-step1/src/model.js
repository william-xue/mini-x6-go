import { DesignerModel as Step3Model } from '../../lesson7-step3/src/model.js'
import { nearestAcrossShapes } from './outline-source.js'

let nextPinId = 1

export class DesignerModel extends Step3Model {
  constructor(width, height) {
    super(width, height)
    this.outlineShapes = [] // 素材里读出来的每一条候选轮廓
    this.outlineReport = null // 最近一次读取的诊断结果
  }

  /**
   * 替换轮廓来源：从"人喂一条 pathData"改成"素材里读出的一群图形"。
   * snapOutline 仍然保留为**一条主轮廓**，第 8 课的裁切与高亮继续可用。
   */
  setOutlineShapes(shapes, report = null) {
    this.outlineShapes = shapes.map((shape) => ({
      ...shape,
      points: shape.points.map((point) => ({ ...point })),
    }))
    this.outlineReport = report
    const primary = this.outlineShapes[0]
    this.snapOutline = primary ? primary.points.map((point) => ({ ...point })) : []
    this.emit('outline:changed', this.snapOutline)
  }

  /**
   * 落点：在所有候选轮廓里找离鼠标最近的一段。
   * 单图形素材下，这里的结果与 7.3/7.5 逐点一致（同一个 nearestPointOnOutline）。
   */
  addPinNear(point, maxDistance = 50) {
    const candidates = this.outlineShapes.length
      ? this.outlineShapes
      : [{ id: 'manual', tag: 'path', points: this.snapOutline }]

    const snapped = nearestAcrossShapes(candidates, point, maxDistance)
    if (!snapped) return null

    const pin = {
      id: `pin-${nextPinId++}`,
      x: snapped.point.x,
      y: snapped.point.y,
      u: snapped.point.x / this.width,
      v: snapped.point.y / this.height,
      direction: snapped.direction,
      normal: snapped.normal,
      segmentIndex: snapped.segmentIndex,
      shapeId: snapped.shapeId, // 新增：这个引脚落在哪条轮廓上
      shapeTag: snapped.tag,
    }
    this.pins.push(pin)
    this.emit('pin:added', pin)
    return pin
  }

  /**
   * 整体清空引脚。
   * 13.2 会有正式的「单个删除 + 拖动重定位」；这里先给一个整体清空的口子，
   * 让 demo 换素材时画面干净 —— 否则旧引脚留在原地，换素材看起来像"没反应"。
   */
  clearPins() {
    this.pins = []
    this.emit('pins:cleared')
  }
}
