import test from 'node:test'
import assert from 'node:assert/strict'
import { Model } from '../src/index.js'

test('stores vertices and hits either polyline segment', () => {
  const model = new Model()
  model.addNode({ id: 'a', x: 0, y: 0, width: 100, height: 40 })
  model.addNode({ id: 'b', x: 300, y: 100, width: 100, height: 40 })
  const edge = model.addEdge({
    id: 'ab',
    source: { cell: 'a' },
    target: { cell: 'b' },
    vertices: [{ x: 200, y: 20 }],
  })

  assert.deepEqual(edge.vertices, [{ x: 200, y: 20 }])
  assert.equal(model.getEdgeAt(130, 24, 8).id, 'ab')
  assert.equal(model.getEdgeAt(260, 64, 8).id, 'ab')
})
