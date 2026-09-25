import test from 'node:test'
import assert from 'node:assert/strict'
import { Library, scaleForWidth } from '../src/index.js'

const definition = { id: 'd1', name: '开关', size: { width: 400, height: 240 }, pins: [] }

test('library stores definitions by id and lists them', () => {
  const library = new Library()
  library.save(definition)
  library.save({ ...definition, id: 'd2', name: '电阻' })

  assert.equal(library.get('d1').name, '开关')
  assert.deepEqual(library.list().map((item) => item.id), ['d1', 'd2'])
  assert.equal(library.get('missing'), null)
})

test('scale keeps one definition at any requested render width', () => {
  assert.equal(scaleForWidth(definition, 400), 1)
  assert.equal(scaleForWidth(definition, 200), 0.5)
  assert.equal(scaleForWidth(definition, 100), 0.25)
})

test('saving the same definition id updates it instead of duplicating', () => {
  const library = new Library()
  library.save(definition)
  library.save({ ...definition, name: '改名后' })

  assert.equal(library.list().length, 1)
  assert.equal(library.get('d1').name, '改名后')
})
