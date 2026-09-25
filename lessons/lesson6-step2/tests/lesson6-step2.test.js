import test from 'node:test'
import assert from 'node:assert/strict'
import { combineSelection } from '../src/index.js'

test('replaces or appends a selection set', () => {
  const previous = new Set(['a', 'b'])
  assert.deepEqual([...combineSelection(previous, ['c'], false)], ['c'])
  assert.deepEqual([...combineSelection(previous, ['c'], true)], ['a', 'b', 'c'])
})
