import { AssemblyInteraction as BaseInteraction } from '../../lesson8-step4/src/interaction.js'
import { validateConnection } from './pin-kind.js'

/**
 * 第 8 课的装配交互是"拉到哪里就连到哪里"。13.3 在同一个位置插一道闸门：
 * 连之前先问规则，拒绝就把理由交出去，不建边。
 */
export class ConnectingInteraction extends BaseInteraction {
  constructor(model, view) {
    super(model, view)
    this.onResult = null
  }

  /** 到定义里查这个端子的身份 */
  pinInfo(terminal) {
    if (!terminal) return null
    const instance = this.model.instances.get(terminal.instanceId)
    if (!instance) return null
    const definition = this.model.definitions.get(instance.definitionId)
    if (!definition) return null
    return (definition.pins || []).find((pin) => pin.id === terminal.portId) || null
  }

  pointerUp(event) {
    if (!this.connecting) {
      super.pointerUp(event)
      return
    }
    const connecting = this.connecting
    this.connecting = null
    this.view.hideTempLine()
    try {
      this.view.root.releasePointerCapture(event.pointerId)
    } catch (error) {
      /* 合成事件下没有活动指针，忽略 */
    }

    const point = this.getPoint(event)
    const snap = this.model.getNearestPort(point.x, point.y, 14, connecting.source)

    if (!snap) {
      // 没落在别的引脚上 → 悬空端，原样放行（第 4 课的行为）
      if (Math.hypot(point.x - connecting.from.x, point.y - connecting.from.y) < 6) return
      this.model.addEdge({ source: connecting.source, target: { x: point.x, y: point.y } })
      this.report({ ok: true, reason: '悬空端：只连了一头，允许（第 4 课的既有行为）' })
      return
    }

    const verdict = validateConnection({
      source: connecting.source,
      target: { instanceId: snap.instanceId, portId: snap.portId },
      edges: [...this.model.edges.values()],
      lookup: (terminal) => this.pinInfo(terminal),
    })

    if (!verdict.ok) {
      this.report(verdict)
      return
    }

    this.model.addEdge({
      source: connecting.source,
      target: { instanceId: snap.instanceId, portId: snap.portId },
    })
    this.report(verdict)
  }

  report(verdict) {
    if (this.onResult) this.onResult(verdict)
  }
}
