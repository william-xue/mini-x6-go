import { Designer } from '../src/index.js'

// 一块"真能看见"的位图（32×32：橙底 + 蓝方块 + 白对角线 + 红边框）
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAgElEQVR42u3WsQ2AMAwAwazEBpmDhu1YhxUYgZqKCCQEwXEQeqfB1jeurrMc5hhNC42AdZ9l7MEEgDVuQNpxIwdwQwBYQwZAowhQhgYgRgU4jG6Yqn0HUg444MBfgNK9egVUU24iAygGBpQMEhANGHgaPJAZJsDVsAJOo3za9cG+hEXeqP5uzMAAAAASUVORK5CYII='

// 一张"内嵌 SVG"的图片：里面的形状是可以被解开的（不是它那个矩形框）
const INNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
  <rect x="5" y="5" width="48" height="70" rx="6" fill="#dbe7ff" stroke="#315fcf" stroke-width="3"/>
  <circle cx="92" cy="40" r="24" fill="#f2ecff" stroke="#a58ee8" stroke-width="3"/>
</svg>`

const MATERIALS = [
  {
    name: '五类"读不了的"混在一起',
    note: '从左到右：内嵌 SVG 的图片（能解出真外形：一个圆角矩形 + 一个圆）、位图（只能退成外接矩形）、一行文字（外接矩形）、一个 use 引用的符号（能解出真三角形）、底下还有一组 display:none 藏起来的圆。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <defs><symbol id="sym" viewBox="0 0 40 40"><polygon points="0,0 40,0 20,40"/></symbol></defs>
  <image x="40" y="30" width="320" height="200" href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(INNER_SVG)}"/>
  <image x="400" y="30" width="150" height="200" href="${PNG}"/>
  <text x="580" y="90" font-size="34" font-family="system-ui" font-weight="bold" fill="#315fcf">断路器</text>
  <use href="#sym" x="580" y="130" width="140" height="140"/>
  <rect x="40" y="260" width="320" height="120" rx="12" fill="#eaf0ff" stroke="#91a8df" stroke-width="4"/>
  <g style="display:none"><circle cx="640" cy="330" r="48" fill="none" stroke="#e04040" stroke-width="4"/></g>
</svg>`,
  },
  {
    name: '只有几何图形（对照）',
    note: '普通素材，用来对照：全部走 13.1 那条路，来源都是"素材里的几何图形（真外形）"。',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <rect x="80" y="80" width="300" height="240" rx="14" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <circle cx="600" cy="200" r="120" fill="#f2ecff" stroke="#a58ee8" stroke-width="5"/>
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

let activeIndex = -1

function applyMaterial(index) {
  activeIndex = index
  designer.clearPins()
  renderTools()
  designer.setSvgBackground(MATERIALS[index].name, MATERIALS[index].svg)
  status.textContent = `引脚 ${designer.model.pins.length} 个`
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

  const toggle = document.createElement('button')
  const on = designer.getIncludeHidden()
  toggle.textContent = `收编隐藏件：${on ? '开' : '关'}`
  toggle.setAttribute('aria-pressed', String(on))
  toggle.addEventListener('click', () => {
    designer.setIncludeHidden(!designer.getIncludeHidden())
    renderTools()
    status.textContent = '已重读轮廓'
  })

  for (const [label, handler] of [
    ['放置引脚', () => designer.setTool('pin')],
    ['平移', () => designer.setTool('pan')],
    ['清除所有引脚', () => { designer.clearPins(); status.textContent = '引脚 0 个' }],
  ]) {
    const button = document.createElement('button')
    button.textContent = label
    button.addEventListener('click', handler)
    tools.appendChild(button)
  }

  tools.append(toggle, status)
}

function renderReport(report) {
  const material = MATERIALS[activeIndex]
  const lines = []
  lines.push(`素材：${material.name}    viewBox ${report.viewBox || '—'}    收编隐藏件：${designer.getIncludeHidden() ? '开' : '关'}`)
  lines.push(`考点：${material.note}`)
  lines.push('')

  if (!report.ok) {
    lines.push(`✗ ${report.error}`)
    reportBox.textContent = lines.join('\n')
    return
  }

  lines.push(`可落点轮廓 ${report.shapes.length} 条（★ = 主轮廓）：`)
  for (const shape of report.shapes) {
    const marks = [shape.hidden ? '隐藏件' : '', shape.approximate ? '矩形近似' : '真外形'].filter(Boolean).join('·')
    lines.push(
      `  ${shape.primary ? '★' : ' '} ${String(shape.id).padEnd(14)} <${String(shape.tag).padEnd(6)}>` +
        `  来源=${reportSourceLabel(shape.source)}  [${marks}]  长度 ${String(shape.length).padStart(8)}`,
    )
  }

  const sources = designer.describeSources(report)
  if (sources.length) {
    lines.push('')
    lines.push('来源统计：')
    for (const item of sources) lines.push(`  ${item.label} × ${item.count}`)
  }

  if (report.skipped.length) {
    lines.push('')
    const total = report.skipped.reduce((sum, item) => sum + item.count, 0)
    lines.push(`仍然读不了的 ${total} 个：`)
    for (const item of report.skipped) lines.push(`  <${item.tag}> ×${item.count} —— ${item.reason}`)
  }

  reportBox.textContent = lines.join('\n')
}

function reportSourceLabel(source) {
  const found = designer.describeSources(designer.outlineReport).find((item) => item.source === source)
  return found ? found.label : source
}

designer.model.on('outline:read', renderReport)
designer.model.on('pin:added', (pin) => {
  status.textContent = `引脚 ${pin.id} → 落在 ${pin.shapeId}（<${pin.shapeTag}>）朝 ${pin.direction || '（无）'}`
})

designer.setTool('pin')
applyMaterial(0)
