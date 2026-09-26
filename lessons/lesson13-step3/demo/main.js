import { Library, scaleForWidth } from '../../lesson8-step3/src/index.js'
import { Assembly, Designer, PIN_KINDS, kindLabel } from '../src/index.js'

// 一条带凹槽的闭合外壳 + 一条开放折线：前者考"朝外"，后者考"开放图形没有朝外"
const MATERIAL = {
  name: '带凹槽的外壳 + 一条开放折线',
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <path d="M140 60 H730 V240 H340 V300 H730 V380 H140 Z" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <polyline points="150,410 430,410 720,410" fill="none" stroke="#a58ee8" stroke-width="5"/>
</svg>`,
}

const designer = new Designer({
  container: document.querySelector('#designer'),
  width: 868,
  height: 420,
})

const assembly = new Assembly({
  container: document.querySelector('#assembly'),
  width: 868,
  height: 300,
})

const library = new Library()
const tools = document.querySelector('#tools')
const pinList = document.querySelector('#pinlist')
const libraryBox = document.querySelector('#library')
const verdictBox = document.querySelector('#verdict')
const status = document.createElement('span')
status.id = 'status'

let saved = 0
let spawned = 0

function buildToolbar() {
  tools.replaceChildren()
  for (const [label, handler] of [
    ['放置引脚', () => designer.setTool('pin')],
    ['平移', () => designer.setTool('pan')],
    ['清除所有引脚', () => { designer.clearPins(); renderPins() }],
    ['保存为元件', saveDefinition],
  ]) {
    const button = document.createElement('button')
    button.textContent = label
    button.addEventListener('click', handler)
    tools.appendChild(button)
  }
  tools.appendChild(status)
}

function saveDefinition() {
  const pins = designer.model.pins
  if (!pins.length) {
    verdictBox.textContent = '先在轮廓上放几个引脚，再保存为元件'
    return
  }
  saved += 1
  const definition = designer.toDefinition(`断路器${saved}`, { snapPathData: null })
  library.save(definition)
  renderLibrary()
  verdictBox.textContent = [
    `已保存定义 ${definition.id}（${definition.size.width.toFixed(0)}×${definition.size.height.toFixed(0)}）`,
    `带下去的引脚身份：`,
    ...definition.pins.map((pin) => `  ${pin.id}  ${pin.name}  ${kindLabel(pin.kind)}  u=${pin.u.toFixed(3)} v=${pin.v.toFixed(3)}  朝=${pin.direction || '（无）'}`),
  ].join('\n')
}

function renderLibrary() {
  libraryBox.replaceChildren()
  const list = library.list()
  if (!list.length) {
    libraryBox.textContent = '库为空 —— 先在设计器上放引脚，再点「保存为元件」'
    return
  }
  for (const definition of list) {
    const button = document.createElement('button')
    button.textContent = `${definition.name}（${definition.pins.length} 引脚）`
    button.addEventListener('click', () => {
      const index = spawned
      spawned += 1
      assembly.addInstance(definition, {
        x: 20 + (index % 2) * 430,
        y: 20,
        scale: scaleForWidth(definition, 380),
      })
      verdictBox.textContent = `已在装配画布放下第 ${index + 1} 台。从引脚拖到另一个引脚试试连线。`
    })
    libraryBox.appendChild(button)
  }
}

function renderPins() {
  const pins = designer.pinSnapshot()
  pinList.replaceChildren()

  const head = document.createElement('tr')
  for (const label of ['引脚', '名称', '类型', '位置', '朝向', '法线角度', '所在图形']) {
    const cell = document.createElement('th')
    cell.textContent = label
    head.appendChild(cell)
  }
  pinList.appendChild(head)

  if (!pins.length) {
    const row = document.createElement('tr')
    const cell = document.createElement('td')
    cell.colSpan = 7
    cell.textContent = '还没有引脚'
    row.appendChild(cell)
    pinList.appendChild(row)
  }

  for (const pin of pins) {
    const row = document.createElement('tr')

    const idCell = document.createElement('td')
    idCell.textContent = pin.id

    const nameCell = document.createElement('td')
    const nameInput = document.createElement('input')
    nameInput.value = pin.name
    nameInput.addEventListener('change', () => {
      designer.renamePin(pin.id, nameInput.value.trim() || pin.name)
      renderPins()
    })
    nameCell.appendChild(nameInput)

    const kindCell = document.createElement('td')
    const select = document.createElement('select')
    for (const kind of PIN_KINDS) {
      const option = document.createElement('option')
      option.value = kind
      option.textContent = kindLabel(kind)
      option.selected = kind === pin.kind
      select.appendChild(option)
    }
    select.addEventListener('change', () => {
      designer.setPinKind(pin.id, select.value)
      renderPins()
    })
    kindCell.appendChild(select)

    const posCell = document.createElement('td')
    posCell.textContent = `(${pin.x}, ${pin.y})`

    const dirCell = document.createElement('td')
    dirCell.textContent = pin.direction || '（无——开放边）'

    const angleCell = document.createElement('td')
    angleCell.textContent = pin.angle === null ? '—' : `${pin.angle}°`

    const shapeCell = document.createElement('td')
    shapeCell.textContent = `${pin.shapeId}（${pin.closed ? '闭合' : '开放'}）`

    row.append(idCell, nameCell, kindCell, posCell, dirCell, angleCell, shapeCell)
    pinList.appendChild(row)
  }

  status.textContent = `引脚 ${pins.length} 个`
}

designer.setSvgBackground(MATERIAL.name, MATERIAL.svg)
designer.setTool('pin')

designer.model.on('pin:added', () => renderPins())
designer.model.on('pin:removed', () => renderPins())
designer.model.on('pin:committed', (pin) => {
  renderPins()
  verdictBox.textContent = `拖动提交：${pin.id} → (${pin.x.toFixed(1)},${pin.y.toFixed(1)})，朝 ${pin.direction || '（无）'}`
})

assembly.onConnectionResult((verdict) => {
  verdictBox.textContent = verdict.ok ? `✓ 允许连线\n${verdict.reason}` : `✗ 拒绝连线\n${verdict.reason}`
})

buildToolbar()
renderPins()
renderLibrary()
verdictBox.textContent = '① 点凹槽内壁放引脚，看朝外；② 改名字和类型；③ 保存元件、摆两台、试着连线'
