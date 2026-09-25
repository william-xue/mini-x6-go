import test from 'node:test'
import assert from 'node:assert/strict'
import { AssemblyModel } from '../src/index.js'

const definition = {
  id: 'd-switch',
  name: '开关',
  size: { width: 200, height: 100 },
  pins: [
    { id: 'a', u: 0, v: 0.5, direction: 'left' },
    { id: 'b', u: 1, v: 0.5, direction: 'right' },
  ],
}

test('edges reference instance ports and resolve to absolute points', () => {
  const model = new AssemblyModel()
  model.addDefinition(definition)
  model.addInstance(definition, { id: 'L', x: 0, y: 0, scale: 1 })
  model.addInstance(definition, { id: 'R', x: 400, y: 0, scale: 1 })
  const edge = model.addEdge({
    source: { instanceId: 'L', portId: 'b' },
    target: { instanceId: 'R', portId: 'a' },
  })

  assert.deepEqual(model.getTerminalPoint(edge.source), { x: 200, y: 50, direction: 'right' })
  assert.deepEqual(model.getTerminalPoint(edge.target), { x: 400, y: 50, direction: 'left' })
})

test('moving an instance moves the edge endpoint without touching the edge data', () => {
  const model = new AssemblyModel()
  model.addDefinition(definition)
  model.addInstance(definition, { id: 'L', x: 0, y: 0, scale: 1 })
  const edge = model.addEdge({
    source: { instanceId: 'L', portId: 'b' },
    target: { x: 500, y: 90 },
  })

  model.moveInstance('L', 60, 30)

  assert.deepEqual(edge.source, { instanceId: 'L', portId: 'b' })
  assert.deepEqual(model.getTerminalPoint(edge.source), { x: 260, y: 80, direction: 'right' })
  assert.deepEqual(model.getTerminalPoint(edge.target), { x: 500, y: 90 })
})

test('nearest port search can exclude the start port', () => {
  const model = new AssemblyModel()
  model.addDefinition(definition)
  model.addInstance(definition, { id: 'L', x: 0, y: 0, scale: 1 })

  assert.equal(model.getNearestPort(0, 50, 14, { instanceId: 'L', portId: 'a' }), null)
  assert.equal(model.getNearestPort(0, 50, 14).portId, 'a')
})

test('free endpoints stay raw coordinates', () => {
  const model = new AssemblyModel()
  model.addDefinition(definition)
  model.addInstance(definition, { id: 'L', x: 0, y: 0, scale: 1 })

  assert.deepEqual(model.getTerminalPoint({ x: 420, y: 130 }), { x: 420, y: 130 })
})
