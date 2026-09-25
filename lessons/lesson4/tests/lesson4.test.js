import test from 'node:test'
import assert from 'node:assert/strict'

import { Model } from '../src/index.js'

function setup() {
  const model = new Model()
  model.addNode({
    id: 'a',
    x: 80,
    y: 100,
    width: 120,
    height: 60,
    ports: [{ id: 'out', x: 1, y: 0.5, direction: 'right' }],
  })
  model.addNode({
    id: 'b',
    x: 600,
    y: 250,
    width: 120,
    height: 60,
    ports: [{ id: 'in', x: 0, y: 0.5, direction: 'left' }],
  })
  return model
}

test('finds the nearest port and never snaps back to the start port', () => {
  const model = setup()
  const exclude = { nodeId: 'a', portId: 'out' }

  const nearB = model.getNearestPort(604, 282, 12, exclude)
  assert.equal(nearB.nodeId, 'b')
  assert.equal(nearB.portId, 'in')

  const nearStart = model.getNearestPort(200, 130, 12, exclude)
  assert.equal(nearStart, null)

  assert.equal(model.getPortAt(220, 150), null)
})

test('a free endpoint returns raw coordinates for dangling edges', () => {
  const model = setup()

  assert.deepEqual(model.getTerminalPoint({ x: 400, y: 300 }), { x: 400, y: 300 })

  const edge = model.addEdge({
    id: 'dangling',
    source: { cell: 'a', port: 'out' },
    target: { x: 400, y: 300 },
  })
  assert.deepEqual(model.getTerminalPoint(edge.target), { x: 400, y: 300 })
})

test('moving a node keeps the port end fixed while the free end stays', () => {
  const model = setup()
  const edge = model.addEdge({
    source: { cell: 'a', port: 'out' },
    target: { x: 400, y: 300 },
  })

  model.moveNode('a', 100, 120)

  assert.deepEqual(model.getTerminalPoint(edge.source), { x: 220, y: 150, direction: 'right' })
  assert.deepEqual(model.getTerminalPoint(edge.target), { x: 400, y: 300 })
})
