import test from 'node:test'
import assert from 'node:assert/strict'
import { History, applyCommand, revertCommand, AssemblyInteraction } from '../src/index.js'

function makeHarness() {
  const instance = {
    id: 'A',
    x: 0,
    y: 0,
    width: 100,
    height: 60,
    scale: 1,
    ports: [],
    body: { x: 0, y: 0, width: 100, height: 60 },
  }
  const model = {
    instances: new Map([['A', instance]]),
    getPortAt: () => null,
    getInstanceAt: () => instance,
    moveInstance(id, x, y) {
      instance.x = x
      instance.y = y
      return instance
    },
  }
  const root = {
    getAttribute: (name) => (name === 'width' ? '868' : '420'),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 868, height: 420 }),
    setPointerCapture() {},
    releasePointerCapture() {},
  }
  const view = { root, selectInstance() {}, moveInstance() {} }
  const history = new History({ model, apply: applyCommand, revert: revertCommand })
  const interaction = new AssemblyInteraction(model, view, history)
  return { instance, model, history, interaction }
}

test('commands are plain data and survive a JSON round trip', () => {
  const command = {
    type: 'instance:move',
    label: '移动 A',
    id: 'A',
    from: { x: 0, y: 0 },
    to: { x: 10, y: 20 },
  }

  assert.deepEqual(JSON.parse(JSON.stringify(command)), command)
})

test('an interpreter applies and reverts a data command', () => {
  const { instance, model } = makeHarness()
  const command = { type: 'instance:move', id: 'A', from: { x: 0, y: 0 }, to: { x: 40, y: 50 } }

  applyCommand(model, command)
  assert.deepEqual([instance.x, instance.y], [40, 50])

  revertCommand(model, command)
  assert.deepEqual([instance.x, instance.y], [0, 0])
})

test('one drag records exactly one command no matter how many moves', () => {
  const { instance, history, interaction } = makeHarness()

  interaction.pointerDown({ clientX: 10, clientY: 10, pointerId: 1 })
  for (let step = 1; step <= 30; step += 1) {
    interaction.pointerMove({ clientX: 10 + step, clientY: 10 + step })
  }
  interaction.pointerUp({ clientX: 40, clientY: 40, pointerId: 1 })

  assert.equal(history.size, 1)
  assert.equal(history.undoStack[0].type, 'instance:move')
  assert.deepEqual([instance.x, instance.y], [30, 30])
})

test('undo returns the instance to where the drag started', () => {
  const { instance, history, interaction } = makeHarness()

  interaction.pointerDown({ clientX: 10, clientY: 10, pointerId: 1 })
  interaction.pointerMove({ clientX: 60, clientY: 70 })
  interaction.pointerUp({ clientX: 60, clientY: 70, pointerId: 1 })

  assert.deepEqual([instance.x, instance.y], [50, 60])
  history.undo()
  assert.deepEqual([instance.x, instance.y], [0, 0])
  history.redo()
  assert.deepEqual([instance.x, instance.y], [50, 60])
})

test('history still works after commands round trip through JSON', () => {
  const { instance, history, interaction } = makeHarness()

  interaction.pointerDown({ clientX: 10, clientY: 10, pointerId: 1 })
  interaction.pointerMove({ clientX: 60, clientY: 70 })
  interaction.pointerUp({ clientX: 60, clientY: 70, pointerId: 1 })

  // 模拟：命令被序列化又读回来，仍然是可用的命令
  history.undoStack = history.undoStack.map((command) => JSON.parse(JSON.stringify(command)))
  history.undo()

  assert.deepEqual([instance.x, instance.y], [0, 0])
})

test('a drag that ends where it started records nothing', () => {
  const { history, interaction } = makeHarness()

  interaction.pointerDown({ clientX: 10, clientY: 10, pointerId: 1 })
  interaction.pointerMove({ clientX: 25, clientY: 25 })
  interaction.pointerMove({ clientX: 10, clientY: 10 })
  interaction.pointerUp({ clientX: 10, clientY: 10, pointerId: 1 })

  assert.equal(history.size, 0)
})

test('a new command clears the redo stack', () => {
  const { history } = makeHarness()
  history.push({ type: 'instance:move', id: 'A', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } })
  history.undo()
  assert.equal(history.canRedo, true)

  history.push({ type: 'instance:move', id: 'A', from: { x: 1, y: 1 }, to: { x: 2, y: 2 } })
  assert.equal(history.canRedo, false)
})

test('undo and redo on an empty stack are no-ops', () => {
  const { history } = makeHarness()

  assert.equal(history.undo(), null)
  assert.equal(history.redo(), null)
  assert.equal(history.canUndo, false)
})

test('the stack keeps at most `limit` commands', () => {
  const { model } = makeHarness()
  const history = new History({ model, apply: applyCommand, revert: revertCommand, limit: 3 })

  for (let index = 0; index < 5; index += 1) {
    history.push({ type: 'instance:move', id: 'A', from: { x: 0, y: 0 }, to: { x: index, y: index } })
  }

  assert.equal(history.size, 3)
})

test('an unknown command type fails loudly instead of silently doing nothing', () => {
  const { model } = makeHarness()

  assert.throws(() => applyCommand(model, { type: 'nope' }), /未知命令类型/)
  assert.throws(() => revertCommand(model, { type: 'nope' }), /未知命令类型/)
})
