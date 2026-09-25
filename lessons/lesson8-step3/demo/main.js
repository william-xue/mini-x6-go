import { Workbench } from '../src/index.js'

const designerWidth = 420
const designerHeight = 240
const pathData = 'M90 50 C160 15 280 18 350 60 C400 90 380 180 300 200 C210 222 110 195 85 130 C73 100 78 68 90 50 Z'
const background = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${designerWidth} ${designerHeight}">
  <rect width="${designerWidth}" height="${designerHeight}" fill="#fbfcff"/>
  <path d="${pathData}" fill="#eaf0ff" stroke="#91a8df" stroke-width="4"/>
</svg>`

const workbench = new Workbench({
  designerContainer: document.querySelector('#designer'),
  assemblyContainer: document.querySelector('#assembly'),
  designerWidth,
  designerHeight,
  assemblyWidth: 868,
  assemblyHeight: 420,
})

workbench.setSvgBackground('device.svg', background)
workbench.setSnapPath(pathData, 6)
workbench.setTool('pin')

const status = document.querySelector('#status')
const libraryList = document.querySelector('#library')

function renderLibrary() {
  libraryList.innerHTML = ''
  for (const definition of workbench.library.list()) {
    const button = document.createElement('button')
    button.textContent = `${definition.name}（${definition.pins.length} 引脚）`
    button.addEventListener('click', () => {
      const instance = workbench.spawn(definition.id)
      status.textContent = `实例化 ${definition.name}：${instance.width.toFixed(0)}×${instance.height.toFixed(0)}`
    })
    libraryList.appendChild(button)
  }
  if (!workbench.library.list().length) libraryList.textContent = '库为空'
}

workbench.designer.model.on('pin:added', (pin) => {
  status.textContent = `放置引脚 ${pin.id}：${pin.direction}`
})

document.querySelector('#pin-tool').addEventListener('click', () => {
  workbench.setTool('pin')
  status.textContent = '在轮廓上点几下，然后保存为元件'
})
document.querySelector('#pan-tool').addEventListener('click', () => workbench.setTool('pan'))

let saved = 0
document.querySelector('#save').addEventListener('click', () => {
  saved += 1
  const definition = workbench.saveCurrent(`元件${saved}`)
  renderLibrary()
  status.textContent = `已保存到库：${definition.name}`
})

renderLibrary()
