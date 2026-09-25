import test from 'node:test'
import assert from 'node:assert/strict'
import { DesignerModel } from '../../lesson7-step3/src/model.js'
import { toDefinition } from '../src/index.js'

function buildModel() {
  const model = new DesignerModel(200, 100)
  model.setBackground('bg.svg', '<svg/>')
  model.setSnapOutline([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 100 },
    { x: 0, y: 100 },
  ])
  model.addPrimitive('rect', 20, 30)
  model.addPinNear({ x: 100, y: -3 })
  return model
}

test('compiles pins into resolution independent normalized coordinates', () => {
  const definition = toDefinition(buildModel(), '开关')

  assert.equal(definition.name, '开关')
  assert.deepEqual(definition.size, { width: 200, height: 100 })
  assert.equal(definition.pins.length, 1)
  assert.equal(definition.pins[0].u, 0.5)
  assert.equal(definition.pins[0].v, 0)
  assert.equal(definition.pins[0].direction, 'top')
})

test('a definition carries no absolute pin coordinates', () => {
  const definition = toDefinition(buildModel(), '开关')
  const pin = definition.pins[0]

  assert.equal('x' in pin, false)
  assert.equal('y' in pin, false)
  assert.equal('normal' in pin, false)
  assert.equal('segmentIndex' in pin, false)
})

test('a definition keeps the visual and shape resources', () => {
  const definition = toDefinition(buildModel(), '开关', { snapPathData: 'M0 0 Z' })

  assert.equal(definition.background.name, 'bg.svg')
  assert.equal(definition.primitives.length, 1)
  assert.equal(definition.primitives[0].kind, 'rect')
  assert.equal(definition.snapPathData, 'M0 0 Z')
  assert.equal(definition.snapOutline.length, 4)
})
