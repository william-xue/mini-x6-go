const SVG_NS = 'http://www.w3.org/2000/svg'

export class SelectionFrame {
  constructor(root) {
    this.rect = document.createElementNS(SVG_NS, 'rect')
    this.rect.setAttribute('fill', 'rgba(49,95,207,0.10)')
    this.rect.setAttribute('stroke', '#315fcf')
    this.rect.setAttribute('stroke-dasharray', '6 4')
    this.rect.setAttribute('pointer-events', 'none')
    this.rect.setAttribute('visibility', 'hidden')
    root.appendChild(this.rect)
  }

  show(bounds) {
    this.rect.setAttribute('x', bounds.x)
    this.rect.setAttribute('y', bounds.y)
    this.rect.setAttribute('width', bounds.width)
    this.rect.setAttribute('height', bounds.height)
    this.rect.setAttribute('visibility', 'visible')
  }

  hide() {
    this.rect.setAttribute('visibility', 'hidden')
  }
}

export function rectFromPoints(start, end) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}
