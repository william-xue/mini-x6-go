import test from 'node:test'
import assert from 'node:assert/strict'
import { screenToWorld, worldToScreen, zoomAt } from '../src/index.js'

test('screen and world conversions are inverse operations', () => {
  const viewport = { x: 40, y: -20, zoom: 2.5 }
  const world = { x: 130, y: 75 }
  const screen = worldToScreen(world, viewport)
  const back = screenToWorld(screen, viewport)

  assert.ok(Math.abs(back.x - world.x) < 1e-9)
  assert.ok(Math.abs(back.y - world.y) < 1e-9)
})

test('zoom keeps the world point under the cursor fixed', () => {
  const viewport = { x: 40, y: 20, zoom: 2 }
  const cursor = { x: 300, y: 200 }
  const before = screenToWorld(cursor, viewport)
  const next = zoomAt(cursor, viewport, 1.5)
  const after = screenToWorld(cursor, next)

  assert.ok(Math.abs(before.x - after.x) < 1e-9)
  assert.ok(Math.abs(before.y - after.y) < 1e-9)
  assert.equal(next.zoom, 3)
})

test('zoom is clamped to the allowed range', () => {
  const base = { x: 0, y: 0, zoom: 1 }
  assert.equal(zoomAt({ x: 0, y: 0 }, base, 100).zoom, 4)
  assert.equal(zoomAt({ x: 0, y: 0 }, base, 0.001).zoom, 0.25)
})
