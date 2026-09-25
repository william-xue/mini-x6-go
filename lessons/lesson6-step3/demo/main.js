import { Graph, Interaction } from '../src/index.js'

const graph = new Graph({ container: document.querySelector('#graph'), width: 868, height: 420 })
for (const node of [
  { id: 'a', x: 90, y: 70, label: 'A' },
  { id: 'b', x: 300, y: 80, label: 'B' },
  { id: 'c', x: 120, y: 250, label: 'C' },
  { id: 'd', x: 520, y: 240, label: 'D' },
]) {
  graph.addNode({ ...node, width: 120, height: 60, ports: [] })
}
new Interaction(graph).enable()
