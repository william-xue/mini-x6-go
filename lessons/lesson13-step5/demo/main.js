import { Designer } from '../src/index.js'

const CANVAS = { width: 620, height: 300 }

// 内嵌 SVG 的图片：里面的图形是真能解开的
const INNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
  <rect x="5" y="5" width="48" height="70" rx="6" fill="#dbe7ff" stroke="#315fcf" stroke-width="3"/>
  <circle cx="92" cy="40" r="24" fill="#f2ecff" stroke="#a58ee8" stroke-width="3"/>
</svg>`

// 注意：这里的素材一律不带 id（不用 use / symbol / clipPath）——
// 两个画布会把同一份素材各挂一份，重复 id 会跨文档解析错。
const MATERIALS = [
  {
    name: '素材尺寸 = 画布尺寸（对照）',
    viewBox: [0, 0, 620, 300],
    note: '素材自己的坐标系和画布一模一样 → 浏览器给的矩阵是单位矩阵 → 两边结果**完全一样**。这就是"不需要 getCTM"的情形，也是前 12 课一直成立的原因。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300">
  <rect x="40" y="50" width="220" height="180" rx="16" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <circle cx="450" cy="140" r="95" fill="#f2ecff" stroke="#a58ee8" stroke-width="5"/>
</svg>`,
  },
  {
    name: '素材只有一半大',
    viewBox: [0, 0, 200, 100],
    note: '素材是 200×100，被放大 3 倍铺进 620×300 → 右边先乘 3 再挪 (10,0)，轮廓铺满；左边不乘，轮廓缩在左上角 200×100 的小块里，跟画面对不上。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <path d="M14 12 C60 2 138 6 188 42 C198 62 60 98 12 88 C2 70 4 30 14 12 Z" fill="#eaf0ff" stroke="#91a8df" stroke-width="4"/>
</svg>`,
  },
  {
    name: '素材里带 transform 的分组',
    viewBox: [0, 0, 620, 300],
    note: '素材里有个 <g transform="translate(370,60) rotate(25)">。右边把"平移 + 旋转"一起算进去；左边丢掉它们 —— 那个矩形会回到没挪过、没转过的位置。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300">
  <rect x="40" y="60" width="200" height="170" rx="16" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <g transform="translate(370,60) rotate(25)">
    <rect x="0" y="0" width="180" height="110" rx="12" fill="#f2ecff" stroke="#a58ee8" stroke-width="5"/>
  </g>
</svg>`,
  },
  {
    name: '内嵌 SVG 的图片（两层坐标）',
    viewBox: [0, 0, 620, 300],
    note: '图片放在 (70,60) 480×180 的位置，里面那个 SVG 自己是 120×80 → 又多一层换算。屏幕上看到的是两个图形，左边只认得出"120×80 那块里的坐标"。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300">
  <image x="70" y="60" width="480" height="180" href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(INNER_SVG)}"/>
</svg>`,
  },
]

/** 手算 meet：和 preserveAspectRatio="xMidYMid meet" 的规则一致 */
function meetOf(viewBox, width, height) {
  const [vx, vy, vw, vh] = viewBox
  const scale = Math.min(width / vw, height / vh)
  return {
    scale,
    offsetX: (width - vw * scale) / 2 - vx * scale,
    offsetY: (height - vh * scale) / 2 - vy * scale,
  }
}

const panelSpecs = [
  { key: 'left', ignoreTransform: true, label: '不换算（假装没有 getCTM）' },
  { key: 'right', ignoreTransform: false, label: '用 getCTM 换算' },
]

const panels = panelSpecs.map((spec) => ({
  ...spec,
  designer: new Designer({
    container: document.querySelector(`#pen-${spec.key}`),
    width: CANVAS.width,
    height: CANVAS.height,
    ignoreTransform: spec.ignoreTransform,
  }),
  rangeBox: document.querySelector(`#range-${spec.key}`),
  noteBox: document.querySelector(`#note-${spec.key}`),
}))

const tools = document.querySelector('#tools')
const reportBox = document.querySelector('#report')
let activeIndex = -1

function applyMaterial(index) {
  activeIndex = index
  const material = MATERIALS[index]

  for (const panel of panels) {
    panel.designer.clearPins()
    panel.designer.setTool('pin')
    panel.designer.setSvgBackground(material.name, material.svg)
    refreshPanel(panel)
  }

  renderTools()
  renderReport()
}

function refreshPanel(panel) {
  const report = panel.designer.outlineReport
  const count = report?.shapes?.length ?? 0
  panel.rangeBox.textContent = `候选 ${count} 条 · ${panel.designer.describeBounds()}`
  panel.noteBox.textContent = ''
}

function renderTools() {
  tools.replaceChildren()

  MATERIALS.forEach((material, index) => {
    const button = document.createElement('button')
    button.textContent = material.name
    button.setAttribute('aria-pressed', String(index === activeIndex))
    button.addEventListener('click', () => applyMaterial(index))
    tools.appendChild(button)
  })

  const clear = document.createElement('button')
  clear.textContent = '清除所有引脚'
  clear.addEventListener('click', () => {
    for (const panel of panels) {
      panel.designer.clearPins()
      panel.noteBox.textContent = ''
      refreshPanel(panel)
    }
  })
  tools.appendChild(clear)
}

function bboxOf(shape) {
  const xs = shape.points.map((point) => point.x)
  const ys = shape.points.map((point) => point.y)
  return `x ${Math.min(...xs).toFixed(0)}~${Math.max(...xs).toFixed(0)}  y ${Math.min(...ys).toFixed(0)}~${Math.max(...ys).toFixed(0)}`
}

function renderReport() {
  const material = MATERIALS[activeIndex]
  const lines = []
  const meet = meetOf(material.viewBox, CANVAS.width, CANVAS.height)

  lines.push(`素材：${material.name}`)
  lines.push(`  素材 viewBox ${material.viewBox.join(' ')}   画布 ${CANVAS.width}×${CANVAS.height}`)
  lines.push(`  手算换算：scale ${meet.scale}   偏移 (${meet.offsetX.toFixed(1)}, ${meet.offsetY.toFixed(1)})   ← 右边用它，左边不用`)
  lines.push(`  考点：${material.note}`)
  lines.push('')

  for (const panel of panels) {
    const report = panel.designer.outlineReport
    const mark = panel.ignoreTransform ? '（假）' : '（真）'
    lines.push(`${panel.label.padEnd(24)} 候选 ${report?.shapes?.length ?? 0} 条   范围 ${panel.designer.describeBounds()}`)

    for (const shape of panel.designer.model.outlineShapes) {
      lines.push(`      ${String(shape.id).padEnd(14)} <${String(shape.tag).padEnd(6)}>   ${bboxOf(shape)}`)
    }
  }

  lines.push('')
  const [left, right] = panels
  const same = left.designer.describeBounds() === right.designer.describeBounds()
  lines.push(same
    ? '→ 两边范围相同：这份素材的矩阵是单位矩阵，换算与不换算等价 —— 所以前 12 课的方法在这类素材上一直是对的。'
    : '→ 两边范围不同：右边是"屏幕上那个图形"的真实位置，左边缩到素材自己的坐标系里去了。')

  reportBox.textContent = lines.join('\n')
}

for (const panel of panels) {
  panel.designer.model.on('outline:read', () => refreshPanel(panel))
  panel.designer.model.on('pin:added', (pin) => {
    panel.noteBox.textContent = `引脚 ${pin.id} 落在 ${pin.shapeId}（<${pin.shapeTag}>）朝 ${pin.direction || '（无）'}`
  })
  panel.designer.model.on('pin:changed', () => {
    renderReport()
  })
}

applyMaterial(0)
