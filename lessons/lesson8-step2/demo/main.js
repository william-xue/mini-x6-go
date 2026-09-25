import { Assembly, getPortPoint } from '../src/index.js'

const definition = {
  id: 'definition-switch',
  name: '开关',
  size: { width: 200, height: 120 },
  background: {
    name: 'switch.svg',
    svgText: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
      <rect x="14" y="24" width="172" height="72" rx="10" fill="#eef3ff" stroke="#91a8df" stroke-width="3"/>
      <circle cx="62" cy="60" r="12" fill="none" stroke="#91a8df" stroke-width="3"/>
      <circle cx="138" cy="60" r="12" fill="none" stroke="#91a8df" stroke-width="3"/>
      <line x1="62" y1="60" x2="132" y2="44" stroke="#91a8df" stroke-width="3"/>
    </svg>`,
  },
  primitives: [],
  pins: [
    { id: 'in', u: 0.07, v: 0.5, direction: 'left' },
    { id: 'out', u: 0.93, v: 0.5, direction: 'right' },
    { id: 'gnd', u: 0.5, v: 0.8, direction: 'bottom' },
  ],
}

const assembly = new Assembly({
  container: document.querySelector('#assembly'),
  width: 868,
  height: 460,
})
assembly.addDefinition(definition)

assembly.addInstance(definition, { id: 'A', x: 80, y: 90, scale: 1 })
assembly.addInstance(definition, { id: 'B', x: 400, y: 70, scale: 0.6 })
assembly.addInstance(definition, { id: 'C', x: 400, y: 250, scale: 1.4 })

const status = document.querySelector('#status')

function report(instance) {
  if (!instance) {
    status.textContent = '点击一个实例查看它的尺寸与端口坐标'
    return
  }
  const out = getPortPoint(instance, 'out')
  status.textContent = `${instance.id}：${instance.width.toFixed(0)}×${instance.height.toFixed(0)}`
    + ` · scale ${instance.scale}`
    + ` · out 端口 (${out.x.toFixed(0)}, ${out.y.toFixed(0)})`
}

report(null)
assembly.model.on('instance:moved', (instance) => report(instance))
assembly.view.root.addEventListener('pointerdown', (event) => {
  const bounds = assembly.view.root.getBoundingClientRect()
  const point = {
    x: (event.clientX - bounds.left) * 868 / bounds.width,
    y: (event.clientY - bounds.top) * 460 / bounds.height,
  }
  report(assembly.model.getInstanceAt(point.x, point.y))
})
