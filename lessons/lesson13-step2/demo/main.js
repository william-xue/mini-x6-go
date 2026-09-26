import { Designer } from '../src/index.js'

const MATERIALS = [
  {
    name: '圆 + 五边形（多图形）',
    note: '两条轮廓都能放引脚；拖动时引脚会吸在各自那条轮廓上滑。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <circle cx="200" cy="205" r="115" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <polygon points="600,80 760,150 710,300 500,300 450,150" fill="#f2ecff" stroke="#a58ee8" stroke-width="5"/>
</svg>`,
  },
  {
    name: '大外壳（考"内部也能放"）',
    note: '13.1 要求必须点在离轮廓 50 个单位以内，元件内部一大片点不到。现在落在元件内部也能放，引脚会投影到你最近的那条边上。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <rect x="120" y="60" width="620" height="300" rx="18" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
</svg>`,
  },
  {
    name: '圆弧拼出的圆',
    note: '转一个圈，看引脚和预览圈的大小是否始终不变 —— 它们都按 1/zoom 反算过。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <path d="M434 70 A140 140 0 0 1 574 210 A140 140 0 0 1 434 350 A140 140 0 0 1 294 210 A140 140 0 0 1 434 70 Z" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
</svg>`,
  },
]

const designer = new Designer({
  container: document.querySelector('#designer'),
  width: 868,
  height: 420,
})

const tools = document.querySelector('#tools')
const pinBox = document.querySelector('#pins')
const status = document.createElement('span')
status.id = 'status'

let activeIndex = -1

function applyMaterial(index) {
  activeIndex = index
  designer.clearPins()
  renderTools()
  designer.setSvgBackground(MATERIALS[index].name, MATERIALS[index].svg)
  renderPins()
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

  const actions = [
    ['放置引脚', () => designer.setTool('pin')],
    ['平移', () => designer.setTool('pan')],
    ['放大', () => designer.zoomBy(1.25)],
    ['缩小', () => designer.zoomBy(1 / 1.25)],
    ['复位', () => {
      designer.view.viewport = { x: 0, y: 0, zoom: 1 }
      designer.view.applyViewport()
    }],
    ['清除所有引脚', () => {
      designer.clearPins()
      renderPins()
    }],
  ]
  for (const [label, handler] of actions) {
    const button = document.createElement('button')
    button.textContent = label
    button.addEventListener('click', handler)
    tools.appendChild(button)
  }

  tools.appendChild(status)
}

function renderPins(note) {
  const pins = designer.pinSnapshot()
  const lines = []
  if (note) lines.push(note)
  lines.push(`当前考点：${MATERIALS[activeIndex].note}`)
  lines.push(`zoom = ${designer.view.viewport.zoom.toFixed(2)}    引脚 ${pins.length} 个`)
  for (const pin of pins) {
    lines.push(`  ${pin.id.padEnd(8)} (${String(pin.x).padStart(7)},${String(pin.y).padStart(7)})  形状 ${pin.shapeId}  朝 ${pin.direction}`)
  }
  pinBox.textContent = lines.join('\n')
  status.textContent = `引脚 ${pins.length} 个`
}

designer.model.on('pin:added', () => renderPins('＋ 新增引脚'))
designer.model.on('pin:removed', (pin) => renderPins(`－ 删除了 ${pin.id}`))
designer.model.on('pin:committed', (pin) => renderPins(`⇢ 拖动提交：${pin.id} 落到 (${pin.x.toFixed(1)},${pin.y.toFixed(1)})，朝 ${pin.direction}`))

designer.setTool('pin')
applyMaterial(1)
