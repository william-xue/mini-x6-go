import test from 'node:test'
import assert from 'node:assert/strict'
import { nearestPointOnOutline } from '../src/index.js'

test('projects a point onto the nearest irregular outline segment', () => {
  const outline = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 130, y: 50 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ]
  const snapped = nearestPointOnOutline({ x: 126, y: 30 }, outline, 40)

  assert.ok(snapped.distance < 20)
  assert.equal(snapped.segmentIndex, 1)
  assert.equal(snapped.direction, 'right')
  assert.ok(snapped.normal.x > 0)
})
