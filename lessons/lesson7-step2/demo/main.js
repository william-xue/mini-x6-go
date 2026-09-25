import { Designer } from '../src/index.js'

const designer = new Designer({
  container: document.querySelector('#designer'),
  width: 868,
  height: 420,
})

const sampleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 868 420">
  <rect width="868" height="420" fill="#fbfcff"/>
  <g stroke="#e5e9f2" stroke-width="1">
    ${Array.from({ length: 17 }, (_, i) => `<path d="M${i * 52} 0V420"/>`).join('')}
    ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${i * 52}H868"/>`).join('')}
  </g>
  <text x="434" y="36" text-anchor="middle" font-family="system-ui" font-size="18" fill="#8a94a8">不可编辑 SVG 背景</text>
</svg>`

designer.setSvgBackground('示例背景.svg', sampleSvg)

let created = 0
document.querySelector('#tools').addEventListener('click', (event) => {
  const kind = event.target.dataset.kind
  if (!kind) return
  designer.addPrimitive(kind, 150 + (created % 4) * 170, 130 + Math.floor(created / 4) * 120)
  created += 1
})

document.querySelector('#svg-file').addEventListener('change', async (event) => {
  const [file] = event.target.files
  if (!file) return
  await designer.loadSvgFile(file)
  document.querySelector('#status').textContent = `已加载：${file.name}`
})
