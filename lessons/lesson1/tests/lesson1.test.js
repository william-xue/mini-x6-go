import test from 'node:test'
import assert from 'node:assert/strict'

import { Graph, Model } from '../src/index.js'

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName
    this.attributes = new Map()
    this.children = []
    this.textContent = ''
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value))
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null
  }

  append(...elements) {
    this.children.push(...elements)
  }

  appendChild(element) {
    this.children.push(element)
    return element
  }
}

globalThis.document = {
  createElementNS(_namespace, tagName) {
    return new FakeElement(tagName)
  },
}

test('edge keeps node references while its endpoint follows the moved node', () => {
  const model = new Model()
  model.addNode({ id: 'a', x: 10, y: 20, width: 100, height: 40 })
  model.addNode({ id: 'b', x: 300, y: 100, width: 100, height: 40 })
  const edge = model.addEdge({
    id: 'ab',
    source: { cell: 'a' },
    target: { cell: 'b' },
  })

  model.moveNode('a', 50, 60)

  assert.deepEqual(edge.source, { cell: 'a' })
  assert.deepEqual(model.getTerminalPoint(edge.source), { x: 100, y: 80 })
})

test('moving a node updates existing SVG elements instead of recreating them', () => {
  const container = new FakeElement('div')
  const graph = new Graph({ container, width: 600, height: 300 })
  graph.addNode({ id: 'a', x: 10, y: 20, width: 100, height: 40, label: 'A' })
  graph.addNode({ id: 'b', x: 300, y: 100, width: 100, height: 40, label: 'B' })
  graph.addEdge({ id: 'ab', source: { cell: 'a' }, target: { cell: 'b' } })

  const nodeElement = graph.view.elements.get('a')
  const edgeElement = graph.view.elements.get('ab')
  graph.moveNode('a', 50, 60)

  assert.equal(graph.view.elements.get('a'), nodeElement)
  assert.equal(graph.view.elements.get('ab'), edgeElement)
  assert.equal(nodeElement.getAttribute('transform'), 'translate(50,60)')
  assert.equal(edgeElement.getAttribute('x1'), '100')
  assert.equal(edgeElement.getAttribute('y1'), '80')
})
