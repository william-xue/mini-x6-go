import { DesignerView as Step4View } from '../../lesson13-step4/src/view.js'
import { splitVisibleRuns } from './occlusion.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * 13.6：只覆盖"轮廓怎么画"这一步，加一层**看得见的证据**。
 *
 *   被埋掉的边  → 浅灰细虚线（形状全貌还在，但一眼知道这里点不着）
 *   可见的边    → 和 13.1 完全一样的画法
 *
 * 没有任何点被埋时，输出与 13.1 逐属性相同（只有一条 polyline，同一套颜色）。
 */
export class DesignerView extends Step4View {
  renderShapeOutlines(shapes, primaryId) {
    this.shapeLayer.replaceChildren()

    for (const shape of shapes) {
      if (shape.buriedCount) {
        const ghost = document.createElementNS(SVG_NS, 'polyline')
        ghost.setAttribute('points', shape.points.map((point) => `${point.x},${point.y}`).join(' '))
        ghost.setAttribute('fill', 'none')
        ghost.setAttribute('stroke', '#cfd4e0')
        ghost.setAttribute('stroke-width', 1.5)
        ghost.setAttribute('stroke-dasharray', '3 4')
        ghost.setAttribute('stroke-linejoin', 'round')
        ghost.setAttribute('vector-effect', 'non-scaling-stroke')
        ghost.setAttribute('pointer-events', 'none')
        ghost.setAttribute('data-buried-id', shape.id)
        this.shapeLayer.appendChild(ghost)
      }

      // 可见段可能不止一条：一条轮廓上常常只有一部分被盖住
      for (const run of splitVisibleRuns(shape.points)) {
        const outline = document.createElementNS(SVG_NS, 'polyline')
        outline.setAttribute('points', run.map((point) => `${point.x},${point.y}`).join(' '))
        outline.setAttribute('fill', 'none')
        outline.setAttribute('stroke', shape.id === primaryId ? '#8b5cf6' : '#c3b1f0')
        outline.setAttribute('stroke-width', shape.id === primaryId ? 2.5 : 1.5)
        outline.setAttribute('stroke-dasharray', '7 5')
        outline.setAttribute('stroke-linejoin', 'round')
        outline.setAttribute('vector-effect', 'non-scaling-stroke')
        outline.setAttribute('pointer-events', 'none')
        outline.setAttribute('data-shape-id', shape.id)
        this.shapeLayer.appendChild(outline)
      }
    }
  }
}
