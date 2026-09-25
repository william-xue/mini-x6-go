import test from 'node:test'
import assert from 'node:assert/strict'
import { Model } from '../src/index.js'

function setup() {
  const model = new Model()
  model.addNode({ id: 'a', x: 0, y: 0, width: 100, height: 40 })
  model.addNode({ id: 'b', x: 300, y: 0, width: 100, height: 40 })
  model.addEdge({ id: 'ab', source: { cell: 'a' }, target: { cell: 'b' } })
  return model
}

test('hits an edge within tolerance but not far away', () => {
  const model = setup()
  assert.equal(model.getEdgeAt(200, 26, 8).id, 'ab')
  assert.equal(model.getEdgeAt(200, 40, 8), null)
})

test('removes only the selected edge', () => {
  const model = setup()
  model.removeEdge('ab')
  assert.equal(model.edges.has('ab'), false)
  assert.equal(model.nodes.size, 2)
})
