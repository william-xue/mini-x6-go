import { Designer } from '../src/index.js'

const designer = new Designer({
  container: document.querySelector('#designer'),
  width: 868,
  height: 420,
})

let created = 0
document.querySelector('#tools').addEventListener('click', (event) => {
  const kind = event.target.dataset.kind
  if (!kind) return
  const column = created % 4
  const row = Math.floor(created / 4)
  designer.addPrimitive(kind, 130 + column * 170, 110 + row * 130)
  created += 1
})
