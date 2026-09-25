import { Graph } from '../src/index.js'

const graph = new Graph({
  container: document.querySelector('#graph'),
  width: 868,
  height: 420,
})

graph.addNode({ id: 'a', x: 80, y: 100, width: 120, height: 60, label: 'A' })
graph.addNode({ id: 'b', x: 600, y: 250, width: 120, height: 60, label: 'B' })
graph.addEdge({ id: 'ab', source: { cell: 'a' }, target: { cell: 'b' } })

let moved = false
document.querySelector('#move-a').addEventListener('click', () => {
  moved = !moved
  graph.moveNode('a', moved ? 260 : 80, moved ? 220 : 100)
})
