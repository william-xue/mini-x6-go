import test from 'node:test'
import assert from 'node:assert/strict'
import { samplePath } from '../src/index.js'

test('samples an open geometry at fixed distance intervals', () => {
  const fakePath = {
    getTotalLength: () => 20,
    getPointAtLength: (distance) => ({ x: distance, y: 0 }),
  }
  assert.deepEqual(samplePath(fakePath, 6), [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 12, y: 0 },
    { x: 18, y: 0 },
    { x: 20, y: 0 },
  ])
})
