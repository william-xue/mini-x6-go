import test from 'node:test'
import assert from 'node:assert/strict'

import { Model } from '../src/index.js'

test('normalizes a port position against its node size', () => {
  const model = new Model()
  model.addNode({
    id: 'a',
    x: 80,
    y: 100,
    width: 120,
    height: 60,
    ports: [{ id: 'out', x: 1, y: 0.5, direction: 'right' }],
  })

  assert.deepEqual(model.getPortPoint('a', 'out'), {
    x: 200,
    y: 130,
    direction: 'right',
  })
})

test('returns null instead of falling back when a named port is missing', () => {
  const model = new Model()
  model.addNode({ id: 'a', x: 80, y: 100, width: 120, height: 60 })

  assert.equal(model.getTerminalPoint({ cell: 'a', port: 'missing' }), null)
})

test('finds a port by a point inside its hit radius', () => {
  const model = new Model()
  model.addNode({
    id: 'a',
    x: 80,
    y: 100,
    width: 120,
    height: 60,
    ports: [{ id: 'out', x: 1, y: 0.5, direction: 'right' }],
  })

  assert.deepEqual(model.getPortAt(203, 132), { nodeId: 'a', portId: 'out' })
  assert.equal(model.getPortAt(220, 150), null)
})
