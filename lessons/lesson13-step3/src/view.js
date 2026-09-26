import { DesignerView as Step2View } from '../../lesson13-step2/src/view.js'
import { PIN_KIND_COLORS, kindLabel } from './pin-style.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
  return element
}

export class DesignerView extends Step2View {
  renderPin(pin) {
    let entry = this.pinElements.get(pin.id)
    if (!entry) {
      const group = svg('g', { 'data-pin-id': pin.id, 'data-pin-state': 'idle', 'pointer-events': 'none' })
      const stem = svg('line', {
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'vector-effect': 'non-scaling-stroke',
      })
      const disc = svg('circle', { 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' })
      const label = svg('text', {
        'font-family': 'system-ui, sans-serif',
        'font-weight': '600',
        'pointer-events': 'none',
      })
      group.append(stem, disc, label)
      this.pinLayer.appendChild(group)
      entry = { group, stem, disc, label }
      this.pinElements.set(pin.id, entry)
    }
    this.paintPin(pin, entry)
    return entry.group
  }

  /** 颜色按引脚类型分：输入 / 输出 / 双向一眼能区分 */
  accentFor(pin, state) {
    const base = (pin && PIN_KIND_COLORS[pin.kind]) || '#f07a28'
    return state === 'idle' ? base : '#d43b00'
  }

  paintPin(pin, entry) {
    super.paintPin(pin, entry)
    if (!entry.label) return
    const zoom = this.viewport.zoom
    const accent = this.accentFor(pin, entry.group.getAttribute('data-pin-state') || 'idle')
    const offset = 15 / zoom
    entry.label.setAttribute('x', String(pin.x + pin.normal.x * offset))
    entry.label.setAttribute('y', String(pin.y + pin.normal.y * offset))
    entry.label.setAttribute('font-size', String(13 / zoom))
    entry.label.setAttribute('fill', accent)
    entry.label.setAttribute('text-anchor', pin.normal.x < -0.4 ? 'end' : pin.normal.x > 0.4 ? 'start' : 'middle')
    entry.label.setAttribute('dominant-baseline', pin.normal.y > 0.4 ? 'hanging' : 'auto')
    entry.label.textContent = `${pin.name}·${kindLabel(pin.kind)}`
    entry.group.setAttribute('data-pin-kind', pin.kind)
    entry.group.setAttribute('data-pin-name', pin.name)
  }
}
