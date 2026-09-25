import test from 'node:test'
import assert from 'node:assert/strict'
import { instantiate, getPortPoint } from '../src/index.js'

const definition = {
  id: 'd-switch',
  name: '开关',
  size: { width: 200, height: 120 },
  pins: [
    { id: 'out', u: 1, v: 0.5, direction: 'right' },
    { id: 'gnd', u: 0.5, v: 1, direction: 'bottom' },
  ],
}

test('one definition instantiates into independent sizes', () => {
  const small = instantiate(definition, { id: 's', x: 0, y: 0, scale: 1 })
  const large = instantiate(definition, { id: 'l', x: 0, y: 0, scale: 2 })

  assert.deepEqual([small.width, small.height], [200, 120])
  assert.deepEqual([large.width, large.height], [400, 240])
})

test('normalized ports land on proportional positions at any scale', () => {
  const small = instantiate(definition, { id: 's', x: 100, y: 50, scale: 1 })
  const large = instantiate(definition, { id: 'l', x: 100, y: 50, scale: 2 })

  assert.deepEqual(getPortPoint(small, 'out'), { x: 300, y: 110, direction: 'right' })
  assert.deepEqual(getPortPoint(large, 'out'), { x: 500, y: 170, direction: 'right' })
})

test('moving an instance carries its ports with it', () => {
  const instance = instantiate(definition, { id: 'm', x: 0, y: 0, scale: 1 })
  instance.x = 60
  instance.y = 30

  assert.deepEqual(getPortPoint(instance, 'gnd'), { x: 160, y: 150, direction: 'bottom' })
})

test('instances do not share the definition port objects', () => {
  const a = instantiate(definition, { id: 'a' })
  const b = instantiate(definition, { id: 'b' })
  a.ports[0].u = 0.1

  assert.equal(b.ports[0].u, 1)
})
