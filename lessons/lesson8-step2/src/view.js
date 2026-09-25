const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
  return element
}

function renderPrimitiveShape(primitive) {
  const common = { fill: 'none', stroke: '#7b8db3', 'stroke-width': 2 }
  if (primitive.kind === 'rect') {
    return svg('rect', { x: primitive.x, y: primitive.y, width: primitive.width, height: primitive.height, ...common })
  }
  if (primitive.kind === 'circle') {
    return svg('circle', { cx: primitive.x, cy: primitive.y, r: primitive.r, ...common })
  }
  if (primitive.kind === 'ellipse') {
    return svg('ellipse', { cx: primitive.x, cy: primitive.y, rx: primitive.rx, ry: primitive.ry, ...common })
  }
  return svg('line', { x1: primitive.x, y1: primitive.y, x2: primitive.x + primitive.endX, y2: primitive.y + primitive.endY, stroke: '#7b8db3', 'stroke-width': 2 })
}

export class AssemblyView {
  constructor(container, width = 868, height = 460) {
    this.root = svg('svg', { width, height, tabindex: 0 })
    this.instanceLayer = svg('g')
    this.root.appendChild(this.instanceLayer)
    container.appendChild(this.root)
    this.elements = new Map()
    this.selectedId = null
  }

  renderInstance(instance, definition) {
    const group = svg('g', { 'data-instance-id': instance.id, 'data-scale': instance.scale })
    group.setAttribute(
      'transform',
      `translate(${instance.x},${instance.y}) scale(${instance.scale})`,
    )

    if (definition.background) {
      group.appendChild(svg('image', {
        href: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(definition.background.svgText)}`,
        x: 0,
        y: 0,
        width: definition.size.width,
        height: definition.size.height,
        'pointer-events': 'none',
      }))
    }

    for (const primitive of definition.primitives) group.appendChild(renderPrimitiveShape(primitive))

    for (const port of instance.ports) {
      group.appendChild(svg('circle', {
        cx: port.u * definition.size.width,
        cy: port.v * definition.size.height,
        r: 5,
        fill: '#ffffff',
        stroke: '#f07a28',
        'stroke-width': 3,
        'data-port-id': port.id,
        'data-direction': port.direction,
      }))
    }

    group.appendChild(svg('rect', {
      'data-instance-box': '',
      x: 0,
      y: 0,
      width: definition.size.width,
      height: definition.size.height,
      fill: 'none',
      stroke: '#315fcf',
      'stroke-width': 0,
    }))

    this.instanceLayer.appendChild(group)
    this.elements.set(instance.id, group)
    return group
  }

  moveInstance(instance) {
    this.elements.get(instance.id)?.setAttribute(
      'transform',
      `translate(${instance.x},${instance.y}) scale(${instance.scale})`,
    )
  }

  selectInstance(id) {
    if (this.selectedId) {
      this.elements.get(this.selectedId)?.querySelector('[data-instance-box]')?.setAttribute('stroke-width', 0)
    }
    this.selectedId = id
    if (id) {
      this.elements.get(id)?.querySelector('[data-instance-box]')?.setAttribute('stroke-width', 3)
    }
  }
}
