import { DesignerView as Step1View } from '../../lesson13-step1/src/view.js'
import {
  BADGE_BASE_RADIUS,
  PIN_BASE_RADIUS,
  PIN_STEM_BASE,
  PREVIEW_BASE_RADIUS,
  badgeCenter,
  worldRadius,
} from './pin-geometry.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
  return element
}

export class DesignerView extends Step1View {
  constructor(container, width, height) {
    super(container, width, height)
    this.pinElements = new Map()

    // 落点预览与删除徽标都放在引脚层之上
    this.previewLayer = svg('g', { 'data-preview-layer': '' })
    this.badgeLayer = svg('g', { 'data-delete-badge-layer': '' })
    this.viewportLayer.append(this.previewLayer, this.badgeLayer)

    this.preview = svg('circle', {
      'data-pin-preview': '',
      fill: 'none',
      stroke: '#8b5cf6',
      'stroke-width': 2,
      'stroke-dasharray': '4 3',
      'vector-effect': 'non-scaling-stroke',
      'pointer-events': 'none',
    })
    this.preview.style.display = 'none'
    this.previewLayer.appendChild(this.preview)

    this.badge = svg('g', { 'data-delete-badge': '', 'pointer-events': 'none' })
    this.badge.appendChild(svg('circle', {
      'data-badge-disc': '',
      fill: '#e04040',
      stroke: '#ffffff',
      'stroke-width': 2,
      'vector-effect': 'non-scaling-stroke',
    }))
    const cross = svg('text', {
      'data-badge-cross': '',
      fill: '#ffffff',
      'font-family': 'system-ui, sans-serif',
      'font-weight': 'bold',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
    })
    cross.textContent = '×'
    this.badge.appendChild(cross)
    this.badge.style.display = 'none'
    this.badgeLayer.appendChild(this.badge)
  }

  renderPin(pin) {
    let entry = this.pinElements.get(pin.id)
    if (!entry) {
      const group = svg('g', { 'data-pin-id': pin.id, 'data-pin-state': 'idle', 'pointer-events': 'none' })
      const stem = svg('line', {
        stroke: '#f07a28',
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'vector-effect': 'non-scaling-stroke',
      })
      const disc = svg('circle', {
        fill: '#ffffff',
        stroke: '#f07a28',
        'stroke-width': 3,
        'vector-effect': 'non-scaling-stroke',
      })
      group.append(stem, disc)
      this.pinLayer.appendChild(group)
      entry = { group, stem, disc }
      this.pinElements.set(pin.id, entry)
    }
    this.paintPin(pin, entry)
    return entry.group
  }

  updatePin(pin) {
    if (this.pinElements.has(pin.id)) this.renderPin(pin)
  }

  removePin(pinId) {
    const entry = this.pinElements.get(pinId)
    if (entry) entry.group.remove()
    this.pinElements.delete(pinId)
  }

  setPinState(pinId, state) {
    const entry = this.pinElements.get(pinId)
    if (!entry) return
    entry.group.setAttribute('data-pin-state', state)
    const accent = this.accentFor(entry.pin, state)
    entry.stem.setAttribute('stroke', accent)
    entry.disc.setAttribute('stroke', accent)
    entry.disc.setAttribute('fill', state === 'dragging' ? accent : '#ffffff')
    this.applyPinSize(pinId, state)
  }

  /** 引脚用什么颜色。13.2 只区分"普通/激活"；13.3 会按引脚类型上色。 */
  accentFor(pin, state) {
    return state === 'idle' ? '#f07a28' : '#d43b00'
  }

  /** 引脚半径、法线短杆的长度都按 1/zoom 反算，所以视觉大小与点击手感不随缩放漂移。 */
  applyPinSize(pinId, state) {
    const entry = this.pinElements.get(pinId)
    if (!entry) return
    const zoom = this.viewport.zoom
    const grow = state === 'hover' || state === 'dragging' ? 1.35 : 1
    entry.disc.setAttribute('r', String(worldRadius(PIN_BASE_RADIUS * grow, zoom)))
    if (entry.pin) this.paintStem(entry.pin, entry.stem, zoom)
  }

  paintStem(pin, stem, zoom) {
    const length = worldRadius(PIN_STEM_BASE, zoom)
    stem.setAttribute('x1', String(pin.x))
    stem.setAttribute('y1', String(pin.y))
    stem.setAttribute('x2', String(pin.x + pin.normal.x * length))
    stem.setAttribute('y2', String(pin.y + pin.normal.y * length))
  }

  paintPin(pin, entry) {
    entry.pin = pin
    entry.group.setAttribute('data-direction', pin.direction)
    entry.group.setAttribute('data-shape-id', pin.shapeId || '')
    this.paintStem(pin, entry.stem, this.viewport.zoom)
    entry.disc.setAttribute('cx', String(pin.x))
    entry.disc.setAttribute('cy', String(pin.y))
    this.applyPinSize(pin.id, entry.group.getAttribute('data-pin-state') || 'idle')
  }

  refreshPinSizes() {
    // 父类构造函数里就会调一次 applyViewport，那时这些层还没建好 —— 必须先守一道
    if (!this.pinElements || !this.preview || !this.badge) return
    for (const [pinId, entry] of this.pinElements) {
      if (entry.pin) this.paintPin(entry.pin, entry)
      this.applyPinSize(pinId, entry.group.getAttribute('data-pin-state') || 'idle')
    }
    if (this.preview.style.display !== 'none') {
      this.preview.setAttribute('r', String(worldRadius(PREVIEW_BASE_RADIUS, this.viewport.zoom)))
    }
    if (this.badge.style.display !== 'none' && this.badgePin) this.showBadge(this.badgePin)
  }

  applyViewport() {
    super.applyViewport()
    this.refreshPinSizes()
  }

  showPreview(point) {
    const zoom = this.viewport.zoom
    this.preview.setAttribute('cx', String(point.x))
    this.preview.setAttribute('cy', String(point.y))
    this.preview.setAttribute('r', String(worldRadius(PREVIEW_BASE_RADIUS, zoom)))
    this.preview.style.display = ''
  }

  hidePreview() {
    this.preview.style.display = 'none'
  }

  showBadge(pin) {
    this.badgePin = pin
    const zoom = this.viewport.zoom
    const center = badgeCenter(pin, zoom)
    const radius = worldRadius(BADGE_BASE_RADIUS, zoom)
    this.badge.querySelector('[data-badge-disc]').setAttribute('cx', String(center.x))
    this.badge.querySelector('[data-badge-disc]').setAttribute('cy', String(center.y))
    this.badge.querySelector('[data-badge-disc]').setAttribute('r', String(radius))
    const cross = this.badge.querySelector('[data-badge-cross]')
    cross.setAttribute('x', String(center.x))
    cross.setAttribute('y', String(center.y))
    cross.setAttribute('font-size', String(radius * 1.4))
    this.badge.style.display = ''
  }

  hideBadge() {
    this.badge.style.display = 'none'
    this.badgePin = null
  }
}
