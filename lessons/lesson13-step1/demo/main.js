import { Designer } from '../src/index.js'

// 一块"真能看见"的图片（32×32 手写 PNG：橙底 + 蓝方块 + 白对角线 + 红边框）。
// 用它是为了让"图片读不了"这件事在画面上有个明确的对象。
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAgElEQVR42u3WsQ2AMAwAwazEBpmDhu1YhxUYgZqKCCQEwXEQeqfB1jeurrMc5hhNC42AdZ9l7MEEgDVuQNpxIwdwQwBYQwZAowhQhgYgRgU4jG6Yqn0HUg444MBfgNK9egVUU24iAygGBpQMEhANGHgaPJAZJsDVsAJOo+3za9cG+hEXeqP5uzMAAAAASUVORK5CYII='

// 六种故意"奇怪"的电力/工业素材。每一种都在考一件事。
const MATERIALS = [
  {
    name: '规则外壳 + 通铺底色',
    note: '素材底下铺了一整块画布底色（浅到几乎看不见的那块）。它盖住了 100% 的画布，所以被当成"通铺底色"从候选里摘掉了 —— 看诊断面板里的「摘掉底色 1 条」。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <rect width="868" height="420" fill="#fbfcff"/>
  <rect x="110" y="70" width="300" height="230" rx="14" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
</svg>`,
  },
  {
    name: '圆 + 五边形（多图形）',
    note: '一个素材里有两条独立轮廓。两条都在候选里，谁离鼠标近就算谁 —— 这正是"形状千奇百怪"能自动成立的原因。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <circle cx="200" cy="205" r="115" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <polygon points="600,80 760,150 710,300 500,300 450,150" fill="#f2ecff" stroke="#a58ee8" stroke-width="5"/>
</svg>`,
  },
  {
    name: '圆弧拼出的圆（A 命令）',
    note: '这个圆是四段圆弧命令 A 拼出来的。人写不出它的轮廓，但浏览器能报出长度 —— 诊断里应看到约 879.77，正好等于 2π×140。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <path d="M434 70 A140 140 0 0 1 574 210 A140 140 0 0 1 434 350 A140 140 0 0 1 294 210 A140 140 0 0 1 434 70 Z" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
</svg>`,
  },
  {
    name: '纯线条简图（line / polyline）',
    note: '读得到 3 条，其中两条是 <line>（AntV X6 那个插件的候选名单里漏掉了 line）。注意：在 polyline 两端之间的空白处点一下，引脚会吸到一条不存在的对角线上 —— 这是 7.3 落点算法"按闭合折线处理"的已知缺陷，13.3 修。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <line x1="160" y1="330" x2="400" y2="90" stroke="#91a8df" stroke-width="6" stroke-linecap="round"/>
  <line x1="400" y1="90" x2="700" y2="330" stroke="#91a8df" stroke-width="6" stroke-linecap="round"/>
  <polyline points="400,90 470,210 620,210" fill="none" stroke="#a58ee8" stroke-width="6" stroke-linejoin="round"/>
</svg>`,
  },
  {
    name: '带凹槽的外壳',
    note: '外壳右边挖了一个凹槽。凹槽内壁的"朝外方向"会被算反（引脚像插反的二极管，引出线朝元件肚子里走）—— 这是给 13.3 留的靶子，点凹槽内壁就能看到。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <path d="M140 60 H730 V240 H340 V300 H730 V380 H140 Z" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
</svg>`,
  },
  {
    name: '带文字 / 图片 / 隐藏件',
    note: '这张素材放了四样东西：① 左边一块圆角矩形 —— 唯一读得到的，只有它长出了虚线轮廓；② 中间「断路器」一行字（文字，读不了）；③ 右边一块花图（图片，读不了）；④ 底下藏了一个 display:none 的**组**，组里有一条横穿画布的红色粗线 + 一圈红色边框（整组都看不见，会被过滤掉，所以画面上你看不到它们 —— 这正是"只看元素自己"会漏判的那种写法）。诊断面板里逐条写着为什么。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <g style="display:none">
    <rect x="0" y="0" width="868" height="420" fill="none" stroke="#e04040" stroke-width="12"/>
    <line x1="0" y1="390" x2="868" y2="390" stroke="#e04040" stroke-width="12"/>
  </g>
  <rect x="70" y="50" width="250" height="320" rx="14" fill="#dbe7ff" stroke="#315fcf" stroke-width="5"/>
  <text x="195" y="228" text-anchor="middle" font-size="42" font-weight="bold" font-family="system-ui" fill="#315fcf">断路器</text>
  <image x="400" y="50" width="220" height="320" href="${PNG}"/>
  <use href="#nonexistent"/>
</svg>`,
  },
]

const designer = new Designer({
  container: document.querySelector('#designer'),
  width: 868,
  height: 420,
})

const tools = document.querySelector('#tools')
const reportBox = document.querySelector('#report')
const status = document.createElement('span')
status.id = 'status'
status.textContent = '放几个引脚试试'

let activeIndex = -1

function applyMaterial(index) {
  activeIndex = index
  // 换素材先清引脚：否则旧引脚留在原地，新旧混在一起，看起来像"换了没反应"
  designer.clearPins()
  renderTabs()
  designer.setSvgBackground(MATERIALS[index].name, MATERIALS[index].svg)
  updateStatus()
}

function updateStatus(text) {
  status.textContent = text ?? `引脚 ${designer.model.pins.length} 个`
}

function renderTabs() {
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
    ['重读轮廓', () => designer.readOutline()],
    ['清除所有引脚', () => {
      designer.clearPins()
      updateStatus('已清除所有引脚')
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

function renderReport(report) {
  const material = MATERIALS[activeIndex]
  const lines = []
  lines.push(`素材：${material.name}    viewBox ${report.viewBox || '—'}`)
  lines.push(`考点：${material.note}`)
  lines.push('')

  if (!report.ok) {
    lines.push(`✗ ${report.error}`)
    reportBox.textContent = lines.join('\n')
    return
  }

  lines.push(`读到候选轮廓 ${report.shapes.length} 条（★ = 主轮廓，供第 8 课裁切/高亮用）：`)
  for (const shape of report.shapes) {
    lines.push(
      `  ${shape.primary ? '★' : ' '} ${String(shape.id).padEnd(14)} <${shape.tag}>` +
        `  长度 ${String(shape.length).padStart(8)}  间隔 ${String(shape.step).padStart(7)}  ${shape.pointCount} 个点`,
    )
  }

  if (report.backgrounds.length) {
    lines.push('')
    lines.push(`按「通铺底色」摘掉 ${report.backgrounds.length} 条：${report.backgrounds.map((s) => `<${s.tag}>`).join(' ')}`)
  }

  if (report.skipped.length) {
    lines.push('')
    const total = report.skipped.reduce((sum, item) => sum + item.count, 0)
    lines.push(`读不了的 ${total} 个：`)
    for (const item of report.skipped) lines.push(`  <${item.tag}> ×${item.count} —— ${item.reason}`)
  }

  reportBox.textContent = lines.join('\n')
}

designer.model.on('outline:read', renderReport)
designer.model.on('pin:added', (pin) => {
  updateStatus(`引脚 ${pin.id} → 落在 ${pin.shapeId}（<${pin.shapeTag}>）朝 ${pin.direction}`)
})

designer.setTool('pin')
applyMaterial(0)
