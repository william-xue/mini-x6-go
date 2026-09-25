import { Designer } from '../src/index.js'

const width = 868
const height = 420
const outline = [
  { x: 240, y: 70 },
  { x: 570, y: 70 },
  { x: 650, y: 150 },
  { x: 590, y: 300 },
  { x: 430, y: 350 },
  { x: 250, y: 300 },
  { x: 170, y: 180 },
]

const background = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#fbfcff"/>
  <polygon points="${outline.map((point) => `${point.x},${point.y}`).join(' ')}" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <circle cx="360" cy="190" r="56" fill="none" stroke="#91a8df" stroke-width="5"/>
  <circle cx="470" cy="190" r="56" fill="none" stroke="#91a8df" stroke-width="5"/>
  <text x="410" y="270" text-anchor="middle" font-family="system-ui" font-size="20" fill="#66779b">不规则元件</text>
</svg>`

const designer = new Designer({ container: document.querySelector('#designer'), width, height })
designer.setSvgBackground('irregular-component.svg', background)
designer.setSnapOutline(outline)
designer.setTool('pin')

const status = document.querySelector('#status')
designer.model.on('pin:added', (pin) => {
  status.textContent = `pin ${pin.id}：${pin.direction}，轮廓段 ${pin.segmentIndex}`
})

document.querySelector('#pin-tool').addEventListener('click', () => {
  designer.setTool('pin')
  status.textContent = '引脚工具：点击紫色虚线附近'
})
document.querySelector('#select-tool').addEventListener('click', () => {
  designer.setTool('select')
  status.textContent = '选择工具'
})
