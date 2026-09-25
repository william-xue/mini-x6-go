import { Designer } from '../src/index.js'

const width = 868
const height = 420
const pathData = 'M240 80 C350 20 530 35 630 130 C700 220 610 335 470 355 C315 375 165 300 180 180 C185 130 205 100 240 80 Z'
const background = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#fbfcff"/>
  <g stroke="#e5e9f2" stroke-width="1">
    ${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 50} 0V${height}"/>`).join('')}
    ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${i * 50}H${width}"/>`).join('')}
  </g>
  <path d="${pathData}" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <text x="420" y="300" text-anchor="middle" font-family="system-ui" font-size="20" fill="#66779b">视口坐标系</text>
</svg>`

const designer = new Designer({ container: document.querySelector('#designer'), width, height })
designer.setSvgBackground('component.svg', background)
designer.setSnapPath(pathData, 6)

const status = document.querySelector('#status')

function report(text) {
  const { x, y, zoom } = designer.view.viewport
  status.textContent = `${text} · zoom ${zoom.toFixed(2)} · x ${x.toFixed(0)} · y ${y.toFixed(0)}`
}

designer.setTool('pan')
report('工具：pan')

for (const tool of ['pin', 'pan', 'select']) {
  document.querySelector(`#${tool}-tool`).addEventListener('click', () => {
    designer.setTool(tool)
    report(`工具：${tool}`)
  })
}

document.querySelector('#zoom-in').addEventListener('click', () => {
  designer.zoomBy(1.25)
  report('放大')
})
document.querySelector('#zoom-out').addEventListener('click', () => {
  designer.zoomBy(1 / 1.25)
  report('缩小')
})
document.querySelector('#reset').addEventListener('click', () => {
  designer.view.viewport = { x: 0, y: 0, zoom: 1 }
  designer.view.applyViewport()
  report('复位')
})

designer.model.on('pin:added', (pin) => report(`pin ${pin.id} ${pin.direction}`))
