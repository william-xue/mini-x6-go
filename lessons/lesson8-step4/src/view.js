import { AssemblyView as BaseView } from '../../lesson8-step2/src/view.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
  return element
}

export class AssemblyView extends BaseView {
  constructor(container, width, height, model) {
    super(container, width, height)
    this.model = model
    this.edgeLayer = svg('g')
    this.root.insertBefore(this.edgeLayer, this.instanceLayer)
    this.edgeElements = new Map()
    this.tempLine = null
  }

  renderEdge(edge) {
    let line = this.edgeElements.get(edge.id)
    if (!line) {
      line = svg('line', { stroke: '#3f78ff', 'stroke-width': 2 })
      this.edgeLayer.appendChild(line)
      this.edgeElements.set(edge.id, line)
    }
    const source = this.model.getTerminalPoint(edge.source)
    const target = this.model.getTerminalPoint(edge.target)
    line.setAttribute('x1', source.x)
    line.setAttribute('y1', source.y)
    line.setAttribute('x2', target.x)
    line.setAttribute('y2', target.y)
    return line
  }

  showTempLine(from, to) {
    if (!this.tempLine) {
      this.tempLine = svg('line', {
        stroke: '#9099b0',
        'stroke-width': 2,
        'stroke-dasharray': '6 4',
        'pointer-events': 'none',
      })
      this.edgeLayer.appendChild(this.tempLine)
    }
    this.tempLine.setAttribute('x1', from.x)
    this.tempLine.setAttribute('y1', from.y)
    this.tempLine.setAttribute('x2', to.x)
    this.tempLine.setAttribute('y2', to.y)
  }

  hideTempLine() {
    if (!this.tempLine) return
    this.tempLine.remove()
    this.tempLine = null
  }
}
