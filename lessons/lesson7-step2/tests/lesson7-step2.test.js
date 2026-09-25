import test from 'node:test'
import assert from 'node:assert/strict'
import { DesignerModel } from '../src/index.js'

test('stores SVG background as one opaque resource', () => {
  const model = new DesignerModel()
  const svgText = '<svg><rect width="10" height="10"/></svg>'
  model.setBackground('sample.svg', svgText)

  assert.deepEqual(model.background, { name: 'sample.svg', svgText })
  assert.equal(model.primitives.size, 0)
})
