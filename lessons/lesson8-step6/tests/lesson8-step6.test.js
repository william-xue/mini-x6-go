import test from 'node:test'
import assert from 'node:assert/strict'
import { routeEdge } from '../src/index.js'

function segments(points) {
  return points.slice(0, -1).map((point, index) => [point, points[index + 1]])
}

function isAxisAligned([a, b]) {
  return Math.abs(a.x - b.x) < 1e-9 || Math.abs(a.y - b.y) < 1e-9
}

function exitsAlong(points, direction) {
  const [a, b] = [points[0], points[1]]
  if (direction === 'right') return Math.abs(a.y - b.y) < 1e-9 && b.x > a.x
  if (direction === 'left') return Math.abs(a.y - b.y) < 1e-9 && b.x < a.x
  if (direction === 'top') return Math.abs(a.x - b.x) < 1e-9 && b.y < a.y
  return Math.abs(a.x - b.x) < 1e-9 && b.y > a.y
}

test('leaves the source along its own port direction', () => {
  for (const direction of ['right', 'left', 'top', 'bottom']) {
    const points = routeEdge({ x: 0, y: 0, direction }, { x: 200, y: 120, direction: 'left' })
    assert.ok(exitsAlong(points, direction), `${direction}: ${JSON.stringify(points.slice(0, 2))}`)
  }
})

test('arrives at the target from the target port direction', () => {
  const points = routeEdge({ x: 0, y: 0, direction: 'right' }, { x: 200, y: 120, direction: 'left' })
  const last = points[points.length - 1]
  const beforeLast = points[points.length - 2]

  assert.ok(beforeLast.x < last.x, 'left facing port must be approached from its left')
  assert.equal(beforeLast.y, last.y)
})

test('every segment stays axis aligned', () => {
  const cases = [
    [{ x: 0, y: 0, direction: 'right' }, { x: 200, y: 120, direction: 'left' }],
    [{ x: 0, y: 0, direction: 'bottom' }, { x: 160, y: 200, direction: 'top' }],
    [{ x: 40, y: 90, direction: 'left' }, { x: 300, y: 30, direction: 'bottom' }],
    [{ x: 40, y: 90, direction: 'top' }, { x: 300, y: 30, direction: 'right' }],
    [{ x: 0, y: 0, direction: 'right' }, { x: 260, y: 0, direction: 'right' }],
  ]

  for (const [source, target] of cases) {
    const points = routeEdge(source, target)
    for (const segment of segments(points)) {
      assert.ok(isAxisAligned(segment), `not axis aligned: ${JSON.stringify(segment)}`)
    }
  }
})

test('route starts and ends exactly on the ports', () => {
  const source = { x: 12, y: 34, direction: 'right' }
  const target = { x: 300, y: 80, direction: 'left' }
  const points = routeEdge(source, target)

  assert.deepEqual(points[0], { x: 12, y: 34 })
  assert.deepEqual(points[points.length - 1], { x: 300, y: 80 })
})

test('never repeats a consecutive point', () => {
  const cases = [
    [{ x: 0, y: 0, direction: 'right' }, { x: 260, y: 0, direction: 'right' }],
    [{ x: 0, y: 0, direction: 'right' }, { x: 200, y: 0, direction: 'left' }],
  ]

  for (const [source, target] of cases) {
    const points = routeEdge(source, target)
    for (const [a, b] of segments(points)) {
      assert.ok(Math.abs(a.x - b.x) > 1e-9 || Math.abs(a.y - b.y) > 1e-9)
    }
  }
})

test('falls back to a straight segment when a terminal has no direction', () => {
  const points = routeEdge({ x: 0, y: 0, direction: 'right' }, { x: 200, y: 120 })

  assert.deepEqual(points, [{ x: 0, y: 0 }, { x: 200, y: 120 }])
})
