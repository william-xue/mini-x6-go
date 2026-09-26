import { Designer } from '../src/index.js'
import { nearestAcrossVisibleShapes } from '../src/visible-outline.js'

const CANVAS = { width: 620, height: 300 }

const MATERIALS = [
  {
    name: '重叠外壳（一条边被盖住）',
    note: '下面的矩形 A 和上面的矩形 B 重叠，A 的右边缘整条落在 B 的填充里 —— 屏幕上看不见它。',
    probes: [
      { x: 300, y: 200, note: '正好在 A 那条看不见的边上（屏幕这里是一片 B 的填充）' },
      { x: 350, y: 200, note: '在 B 内部，离 A 那条隐形的边 50' },
      { x: 250, y: 200, note: 'B 的可见左边缘' },
    ],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300">
  <rect id="A" x="100" y="100" width="200" height="200" fill="#dbe7ff" stroke="#315fcf" stroke-width="3"/>
  <rect id="B" x="250" y="100" width="200" height="200" fill="#f2ecff" stroke="#a58ee8" stroke-width="3"/>
</svg>`,
  },
  {
    name: '十字交叉的两块板',
    note: '竖板先画、横板后画。交叉处四条边互相穿过 —— 规则是"只有画在上面那个挡得住下面那个"，所以横板一条边都不会被埋。',
    probes: [
      { x: 310, y: 60, note: '竖板露在上面的部分' },
      { x: 310, y: 160, note: '竖板被横板盖住的那一段（同一根竖边）' },
      { x: 150, y: 160, note: '横板的边' },
    ],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300">
  <rect id="竖板" x="250" y="40" width="120" height="220" fill="#dbe7ff" stroke="#315fcf" stroke-width="3"/>
  <rect id="横板" x="80" y="120" width="460" height="80" fill="#f2ecff" stroke="#a58ee8" stroke-width="3"/>
</svg>`,
  },
  {
    name: '外壳 + 内部圆环（看得见的内腔）',
    note: '圆环画在外壳之后：它挡住外壳右边缘的一小段（那段被埋），但<b>它自己一个点都没被埋</b> —— 压在矩形上的那部分照样能放引脚。内腔的边一条都不许丢。',
    probes: [
      { x: 430, y: 150, note: '圆环压在矩形上的那一侧（可见，可放）' },
      { x: 440, y: 150, note: '矩形右边缘被圆环盖住的那一段' },
      { x: 440, y: 90, note: '同一根矩形右边缘，但露在圆环外面的部分' },
    ],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300">
  <rect id="外壳" x="100" y="60" width="340" height="180" fill="#dbe7ff" stroke="#315fcf" stroke-width="3"/>
  <circle id="内环" cx="430" cy="150" r="70" fill="#f2ecff" stroke="#a58ee8" stroke-width="3"/>
</svg>`,
  },
  {
    name: '内部件整块被盖住',
    note: '小矩形先画，大矩形后画并且完全盖住它 —— 小矩形屏幕上一点都看不见，它的采样点会整条被埋，一个引脚都放不上去。这是对的：看不见的东西不该能点。',
    probes: [
      { x: 310, y: 150, note: '那个已经完全看不见的内部件上' },
      { x: 100, y: 150, note: '大矩形露出来的左边缘' },
    ],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300">
  <rect id="内部件" x="250" y="110" width="120" height="80" fill="#ffe0e0" stroke="#c0392b" stroke-width="3"/>
  <rect id="外壳" x="100" y="60" width="420" height="180" fill="#dbe7ff" stroke="#315fcf" stroke-width="3"/>
</svg>`,
  },
]

const designer = new Designer({
  container: document.querySelector('#designer'),
  width: CANVAS.width,
  height: CANVAS.height,
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
  status.textContent = `素材：${MATERIALS[index].name}`
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
  const ignoring = designer.getIgnoreOcclusion()
  toggle.textContent = `忽略遮挡：${ignoring ? '开（旧行为）' : '关（本课）'}`
  toggle.setAttribute('aria-pressed', String(ignoring))
  toggle.addEventListener('click', () => {
    designer.setIgnoreOcclusion(!designer.getIgnoreOcclusion())
    renderTools()
  })
  tools.appendChild(toggle)

  for (const [label, handler] of [
    ['放置引脚', () => designer.setTool('pin')],
    ['平移', () => designer.setTool('pan')],
    ['清除所有引脚', () => { designer.clearPins() }],
  ]) {
    const button = document.createElement('button')
    button.textContent = label
    button.addEventListener('click', handler)
    tools.appendChild(button)
  }

  tools.append(status)
}

/** 把 buried 标记全部抹掉，模拟"没有遮挡判定"的世界 */
function stripBuried(shapes) {
  return shapes.map((shape) => ({
    ...shape,
    points: shape.points.map((point) => ({ ...point, buried: false })),
  }))
}

function describe(snapped) {
  if (!snapped) return '落不下（8 个单位内没有可见的边）'
  return `落在 (${snapped.point.x.toFixed(1)}, ${snapped.point.y.toFixed(1)})  形状=${snapped.shapeId}  离点击处 ${snapped.distance.toFixed(1)}`
}

function renderReport() {
  const material = MATERIALS[activeIndex]
  const lines = []

  lines.push(`素材：${material.name}`)
  lines.push(`考点：${material.note}`)
  lines.push('')

  if (designer.getIgnoreOcclusion()) {
    lines.push('遮挡判定：**已关闭**（这就是 13.5 之前的行为 —— 看不见的边照样能吸）')
  } else {
    lines.push(`遮挡判定：开启    最多 ${designer.occlusionSummary().occluders} 个遮挡者，被埋 ${designer.occlusionSummary().buriedPoints} / ${designer.occlusionSummary().totalPoints} 个采样点`)
  }
  lines.push('')

  const rows = designer.describeOcclusion()
  if (rows.length) {
    lines.push('id            tag       绘制序   实心    点数    被埋')
    for (const row of rows) {
      lines.push(
        `  ${String(row.id).padEnd(12)}${String(row.tag).padEnd(10)}${String(row.order).padEnd(8)}`
        + `${row.solid ? '是' : '否'}${'  '}${String(row.points).padEnd(8)}${row.buried}`,
      )
    }
    lines.push('')
  }

  lines.push('══ 点这里试试（同一位置，两种模式各算一次）══')
  const shapes = designer.model.outlineShapes
  for (const probe of material.probes) {
    const open = nearestAcrossVisibleShapes(shapes, probe, Number.POSITIVE_INFINITY)
    const off = nearestAcrossVisibleShapes(stripBuried(shapes), probe, Number.POSITIVE_INFINITY)
    lines.push('')
    lines.push(`  点 (${probe.x}, ${probe.y})   ${probe.note}`)
    lines.push(`      忽略遮挡=关（本课）  → ${describe(open)}`)
    lines.push(`      忽略遮挡=开（旧）    → ${describe(off)}`)
  }

  reportBox.textContent = lines.join('\n')
}

designer.model.on('outline:read', renderReport)
designer.model.on('pin:added', (pin) => {
  status.textContent = `引脚 ${pin.id} → ${pin.shapeId}（<${pin.shapeTag}>）朝 ${pin.direction || '（无）'}`
})

designer.setTool('pin')
applyMaterial(0)
