import test from 'node:test'
import assert from 'node:assert/strict'
import { moveSnapshot } from '../src/index.js'

test('applies one drag delta to an immutable position snapshot', () => {
  const snapshot = [{ id: 'a', x: 10, y: 20 }, { id: 'b', x: 40, y: 60 }]
  assert.deepEqual(moveSnapshot(snapshot, 5, -10), [
    { id: 'a', x: 15, y: 10 },
    { id: 'b', x: 45, y: 50 },
  ])
  assert.deepEqual(snapshot[0], { id: 'a', x: 10, y: 20 })
})
