import { AssemblyInteraction as BaseInteraction } from '../../lesson8-step2/src/interaction.js'

export class AssemblyInteraction extends BaseInteraction {
  constructor(model, view) {
    super(model, view)
    this.connecting = null
  }

  pointerDown(event) {
    const point = this.getPoint(event)
    const port = this.model.getPortAt(point.x, point.y)
    if (port) {
      this.connecting = {
        source: { instanceId: port.instanceId, portId: port.portId },
        from: { x: port.x, y: port.y },
      }
      this.view.showTempLine(this.connecting.from, point)
      this.view.root.setPointerCapture(event.pointerId)
      return
    }
    super.pointerDown(event)
  }

  pointerMove(event) {
    if (!this.connecting) {
      super.pointerMove(event)
      return
    }
    this.view.showTempLine(this.connecting.from, this.getPoint(event))
  }

  pointerUp(event) {
    if (!this.connecting) {
      super.pointerUp(event)
      return
    }
    const connecting = this.connecting
    this.connecting = null
    this.view.hideTempLine()
    this.view.root.releasePointerCapture(event.pointerId)

    const point = this.getPoint(event)
    const snap = this.model.getNearestPort(point.x, point.y, 14, connecting.source)
    if (snap) {
      this.model.addEdge({
        source: connecting.source,
        target: { instanceId: snap.instanceId, portId: snap.portId },
      })
      return
    }
    if (Math.hypot(point.x - connecting.from.x, point.y - connecting.from.y) < 6) return
    this.model.addEdge({ source: connecting.source, target: { x: point.x, y: point.y } })
  }
}
