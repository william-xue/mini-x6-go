import { Designer } from '../../lesson7-step5/src/index.js'
import { toDefinition } from '../src/index.js'

const width = 868
const height = 420
const pathData = 'M240 80 C350 20 530 35 630 130 C700 220 610 335 470 355 C315 375 165 300 180 180 C185 130 205 100 240 80 Z'
const background = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#fbfcff"/>
  <path d="${pathData}" fill="#eaf0ff" stroke="#91a8df" stroke-width="5"/>
  <text x="420" y="300" text-anchor="middle" font-family="system-ui" font-size="20" fill="#66779b">元件设计态</text>
</svg>`

const designer = new Designer({ container: document.querySelector('#designer'), width, height })
designer.setSvgBackground('component.svg', background)
designer.setSnapPath(pathData, 6)
designer.setTool('pin')

const status = document.querySelector('#status')
designer.model.on('pin:added', (pin) => {
  status.textContent = `pin ${pin.id}：u ${pin.u.toFixed(3)} · v ${pin.v.toFixed(3)} · ${pin.direction}`
})

document.querySelector('#pin-tool').addEventListener('click', () => designer.setTool('pin'))
document.querySelector('#pan-tool').addEventListener('click', () => designer.setTool('pan'))

document.querySelector('#compile').addEventListener('click', () => {
  const definition = toDefinition(designer.model, '曲线元件', { snapPathData: pathData })

  document.querySelector('#json').textContent = JSON.stringify(
    {
      name: definition.name,
      size: definition.size,
      pins: definition.pins,
      primitiveCount: definition.primitives.length,
      snapOutlinePoints: definition.snapOutline.length,
    },
    null,
    2,
  )

  document.querySelector('#pins').innerHTML = definition.pins
    .map((pin) => `<tr><td>${pin.id}</td><td>${pin.u.toFixed(3)}</td><td>${pin.v.toFixed(3)}</td><td>${pin.direction}</td></tr>`)
    .join('')

  status.textContent = `已生成定义：${definition.pins.length} 个归一化引脚`
})
