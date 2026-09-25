import test from 'node:test'
import assert from 'node:assert/strict'

import { Interaction, Model } from '../src/index.js'

test('finds a node at a graph point', () => {
  const model = new Model()
  model.addNode({ id: 'a', x: 80, y: 100, width: 120, height: 60 })

  assert.equal(model.getNodeAt(100, 120).id, 'a')
  assert.equal(model.getNodeAt(20, 20), null)
})

test('removing a node also removes connected edges', () => {
  const model = new Model()
  model.addNode({ id: 'a' })
  model.addNode({ id: 'b' })
  model.addEdge({ id: 'ab', source: { cell: 'a' }, target: { cell: 'b' } })

  model.removeNode('a')

  assert.equal(model.getNode('a'), null)
  assert.equal(model.edges.has('ab'), false)
})

test('the Mac Backspace key deletes the selected node', () => {
  let removedNodeId = null
  const graph = {
    view: { root: {}, selectNode() {} },
    removeNode(id) {
      removedNodeId = id
    },
  }
  const interaction = new Interaction(graph)
  interaction.selectedNodeId = 'a'

  interaction.keyDown({ key: 'Backspace' })

  assert.equal(removedNodeId, 'a')
})
