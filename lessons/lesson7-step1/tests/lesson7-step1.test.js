import test from 'node:test'
import assert from 'node:assert/strict'
import { DesignerModel } from '../src/index.js'

test('all primitive kinds share one movable x/y origin', () => {
  const model = new DesignerModel()
  for (const kind of ['rect', 'circle', 'ellipse', 'line']) {
    const primitive = model.addPrimitive(kind, 100, 100)
    assert.equal(model.getPrimitiveAt(100, 100).id, primitive.id)
    model.movePrimitive(primitive.id, 200, 180)
    assert.equal(primitive.x, 200)
    assert.equal(primitive.y, 180)
  }
})
