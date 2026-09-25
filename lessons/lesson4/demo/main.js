import { Graph, Interaction } from '../src/index.js'

const graph = new Graph({
  container: document.querySelector('#graph'),
  width: 868,
  height: 420,
})

graph.addNode({
  id: 'a',
  x: 80,
  y: 100,
  width: 120,
  height: 60,
  label: 'A',
  ports: [{ id: 'out', x: 1, y: 0.5, direction: 'right' }],
})

graph.addNode({
  id: 'b',
  x: 600,
  y: 250,
  width: 120,
  height: 60,
  label: 'B',
  ports: [{ id: 'in', x: 0, y: 0.5, direction: 'left' }],
})

new Interaction(graph).enable()
