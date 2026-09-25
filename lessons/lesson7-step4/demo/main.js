import { Designer } from '../src/index.js'

const width = 868
const height = 420
const pathData = 'M240 80 C350 20 530 35 630 130 C700 220 610 335 470 355 C315 375 165 300 180 180 C185 130 205 100 240 80 Z'
const background = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#fbfcff"/>
  <path d="${pathData}" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <circle cx="355" cy="190" r="55" fill="none" stroke="#91a8df" stroke-width="5"/>
  <circle cx="480" cy="190" r="55" fill="none" stroke="#91a8df" stroke-width="5"/>
  <text x="420" y="280" text-anchor="middle" font-family="system-ui" font-size="20" fill="#66779b">贝塞尔曲线元件</text>
</svg>`

const designer = new Designer({ container: document.querySelector('#designer'), width, height })
designer.setSvgBackground('curved-component.svg', background)
designer.setTool('pin')

const status = document.querySelector('#status')
const stepInput = document.querySelector('#step')

function resample() {
  const step = Number(stepInput.value)
  const points = designer.setSnapPath(pathData, step)
  status.textContent = `采样间隔 ${step}px，共 ${points.length} 点`
}

resample()
stepInput.addEventListener('input', resample)
designer.model.on('pin:added', (pin) => {
  status.textContent = `pin ${pin.id}：${pin.direction}，采样段 ${pin.segmentIndex}`
})
document.querySelector('#pin-tool').addEventListener('click', () => designer.setTool('pin'))
document.querySelector('#select-tool').addEventListener('click', () => designer.setTool('select'))
