import { Designer } from '../../lesson7-step5/src/index.js'
import { Library, scaleForWidth } from '../../lesson8-step3/src/index.js'
import { toDefinition } from '../../lesson8-step1/src/index.js'
import { Assembly } from '../src/index.js'

const designerWidth = 420
const designerHeight = 240
const pathData = 'M90 50 C160 15 280 18 350 60 C400 90 380 180 300 200 C210 222 110 195 85 130 C73 100 78 68 90 50 Z'
const background = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${designerWidth} ${designerHeight}">
  <rect width="${designerWidth}" height="${designerHeight}" fill="#fbfcff"/>
  <path d="${pathData}" fill="#eaf0ff" stroke="#91a8df" stroke-width="4"/>
</svg>`

const designer = new Designer({
  container: document.querySelector('#designer'),
  width: designerWidth,
  height: designerHeight,
})
designer.setSvgBackground('device.svg', background)
designer.setSnapPath(pathData, 6)
designer.setTool('pin')

const library = new Library()
const assembly = new Assembly({
  container: document.querySelector('#assembly'),
  width: 868,
  height: 420,
})
let spawned = 0

function spawn(definition) {
  const index = spawned
  spawned += 1
  return assembly.addInstance(definition, {
    x: 30 + (index % 2) * 340,
    y: 20 + Math.floor(index / 2) * 200,
    scale: scaleForWidth(definition, 300),
  })
}

const status = document.querySelector('#status')
const libraryList = document.querySelector('#library')

function renderLibrary() {
  libraryList.replaceChildren()
  if (!library.list().length) {
    libraryList.textContent = '库为空'
    return
  }
  for (const definition of library.list()) {
    const button = document.createElement('button')
    button.textContent = `${definition.name}（${definition.pins.length} 引脚）`
    button.addEventListener('click', () => spawn(definition))
    libraryList.appendChild(button)
  }
}

designer.model.on('pin:added', (pin) => {
  status.textContent = `放置引脚 ${pin.id}：${pin.direction}`
})
assembly.model.on('edge:added', () => {
  status.textContent = `已连接，当前边数 ${assembly.model.edges.size}`
})

document.querySelector('#pin-tool').addEventListener('click', () => designer.setTool('pin'))
document.querySelector('#pan-tool').addEventListener('click', () => designer.setTool('pan'))

let saved = 0
document.querySelector('#save').addEventListener('click', () => {
  saved += 1
  const definition = toDefinition(designer.model, `元件${saved}`, { snapPathData: pathData })
  library.save(definition)
  renderLibrary()
  status.textContent = `已保存到库：${definition.name}`
})

renderLibrary()
