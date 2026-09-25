import test from 'node:test'
import assert from 'node:assert/strict'
import { Model, rectFromPoints } from '../src/index.js'

test('normalizes a reverse drag and selects intersecting nodes', () => {
  const model = new Model()
  model.addNode({ id: 'a', x: 80, y: 80, width: 100, height: 50 })
  model.addNode({ id: 'b', x: 300, y: 300, width: 100, height: 50 })
  const rect = rectFromPoints({ x: 220, y: 180 }, { x: 100, y: 100 })

  assert.deepEqual(rect, { x: 100, y: 100, width: 120, height: 80 })
  assert.deepEqual(model.getNodesInRect(rect).map((node) => node.id), ['a'])
})
