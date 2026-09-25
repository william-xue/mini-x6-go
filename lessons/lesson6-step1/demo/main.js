import { Graph, Interaction } from '../src/index.js'

const graph = new Graph({ container: document.querySelector('#graph'), width: 868, height: 420 })
const nodes = [
  { id: 'a', x: 90, y: 70, label: 'A' },
  { id: 'b', x: 300, y: 80, label: 'B' },
  { id: 'c', x: 120, y: 250, label: 'C' },
  { id: 'd', x: 520, y: 240, label: 'D' },
]

for (const node of nodes) {
  graph.addNode({ ...node, width: 120, height: 60, ports: [] })
}
graph.addEdge({ id: 'ab', source: { cell: 'a' }, target: { cell: 'b' } })
new Interaction(graph).enable()
