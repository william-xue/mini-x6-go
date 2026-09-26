import { DesignerView as Step3View } from '../../lesson13-step3/src/view.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

export class DesignerView extends Step3View {
  constructor(container, width, height) {
    super(container, width, height)
    // 与素材根**同级**的一块 defs：13.4 解析出来的几何临时安放在这里。
    // 同级是关键 —— 这样浏览器给的 getCTM 直接就是画布坐标，不用手算换算。
    this.resolvedDefs = document.createElementNS(SVG_NS, 'defs')
    this.resolvedDefs.setAttribute('data-resolved-layer', '')
    this.root.appendChild(this.resolvedDefs)
  }

  clearResolvedGeometry() {
    this.resolvedDefs.replaceChildren()
  }
}
