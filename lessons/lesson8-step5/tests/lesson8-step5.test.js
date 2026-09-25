import test from 'node:test'
import assert from 'node:assert/strict'
import { DesignerModel } from '../../lesson7-step3/src/model.js'
import { toDefinition } from '../src/index.js'

function buildModel() {
  const model = new DesignerModel(200, 100)
  model.setBackground('bg.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100"/></svg>')
  model.setSnapOutline([
    { x: 40, y: 20 },
    { x: 160, y: 20 },
    { x: 160, y: 80 },
    { x: 40, y: 80 },
  ])
  model.addPrimitive('rect', 60, 40)
  model.addPinNear({ x: 36, y: 50 })
  return model
}

test('crops the definition to the outline bounds plus padding', () => {
  const definition = toDefinition(buildModel(), '元件')

  assert.deepEqual(definition.size, { width: 128, height: 68 })
  assert.deepEqual(definition.snapOutline[0], { x: 4, y: 4 })
})

test('re-normalizes pins against the cropped body', () => {
  const definition = toDefinition(buildModel(), '元件')
  const [pin] = definition.pins

  assert.ok(Math.abs(pin.u - 4 / 128) < 1e-9)
  assert.ok(Math.abs(pin.v - 0.5) < 1e-9)
  assert.equal(pin.direction, 'left')
})

test('shifts primitives by the crop offset', () => {
  const definition = toDefinition(buildModel(), '元件')

  assert.equal(definition.primitives[0].x, 24)
  assert.equal(definition.primitives[0].y, 24)
})

test('rewrites the background viewBox to the cropped body', () => {
  const definition = toDefinition(buildModel(), '元件')

  assert.match(definition.background.svgText, /viewBox="36 16 128 68"/)
})

test('keeps the canvas untouched when there is no outline', () => {
  const model = new DesignerModel(200, 100)
  model.addPrimitive('rect', 10, 10)

  const definition = toDefinition(model, '空')

  assert.deepEqual(definition.size, { width: 200, height: 100 })
  assert.equal(definition.primitives[0].x, 10)
})
