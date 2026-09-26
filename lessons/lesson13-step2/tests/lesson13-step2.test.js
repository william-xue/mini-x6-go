import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BADGE_BASE_OFFSET,
  BADGE_BASE_RADIUS,
  BADGE_HIT_FACTOR,
  badgeCenter,
  badgeHitRadius,
  pinHitTest,
  placementHit,
  pointInPolygon,
  worldRadius,
} from '../src/index.js'

const SQUARE = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]
// L 形：右下角被挖掉一块，凹口在 (40..100, 40..100)
const L_SHAPE = [
  { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 },
  { x: 40, y: 40 }, { x: 40, y: 100 }, { x: 0, y: 100 },
]

test('射线法判内外：凸形状', () => {
  assert.equal(pointInPolygon(SQUARE, { x: 50, y: 50 }), true)
  assert.equal(pointInPolygon(SQUARE, { x: 150, y: 50 }), false)
  assert.equal(pointInPolygon(SQUARE, { x: -1, y: 50 }), false)
  assert.equal(pointInPolygon(SQUARE, { x: 50, y: 200 }), false)
})

test('射线法判内外：凹形状的凹口要算在外面', () => {
  assert.equal(pointInPolygon(L_SHAPE, { x: 20, y: 60 }), true, '竖条里，属于元件内部')
  assert.equal(pointInPolygon(L_SHAPE, { x: 60, y: 60 }), false, '凹口里，不属于元件')
  assert.equal(pointInPolygon(L_SHAPE, { x: 200, y: 60 }), false)
})

test('落点规则：贴边可以，落在内部也可以，远在空白处不行', () => {
  const shapes = [{ id: 'box', tag: 'rect', points: SQUARE }]

  const inside = placementHit(shapes, { x: 50, y: 50 })
  assert.equal(inside.allowed, true)
  assert.equal(inside.inside, true)
  assert.equal(inside.distance, 50, '内部点离最近边的距离')

  const nearEdge = placementHit(shapes, { x: 105, y: 50 })
  assert.equal(nearEdge.allowed, true, '离边 5 个单位，在容差内')
  assert.equal(nearEdge.inside, false)

  const farAway = placementHit(shapes, { x: 130, y: 50 })
  assert.equal(farAway.allowed, false, '离边 30 个单位，太远')
  assert.equal(farAway.distance, 30)

  const loosened = placementHit(shapes, { x: 130, y: 50 }, { edgeTolerance: 40 })
  assert.equal(loosened.allowed, true, '容差可调')

  assert.equal(placementHit([], { x: 0, y: 0 }), null, '没有轮廓时返回 null')
})

test('引脚命中：取最近的，且必须在半径内', () => {
  const pins = [
    { id: 'pin-1', x: 0, y: 0 },
    { id: 'pin-2', x: 100, y: 0 },
  ]
  assert.equal(pinHitTest(pins, { x: 5, y: 0 }, 12).id, 'pin-1')
  assert.equal(pinHitTest(pins, { x: 96, y: 0 }, 12).id, 'pin-2')
  assert.equal(pinHitTest(pins, { x: 5, y: 0 }, 3), null, '半径不够就点不到')
  assert.equal(pinHitTest([], { x: 0, y: 0 }, 12), null)
})

test('尺寸随缩放反算：放大后引脚不变胖，点击半径也不漂', () => {
  assert.equal(worldRadius(6, 1), 6)
  assert.equal(worldRadius(6, 2), 3)
  assert.equal(worldRadius(6, 0.5), 12)
  assert.equal(worldRadius(6, 0), 6, 'zoom 非法时回落到 1')
})

test('删除徽标画在引脚的右上方，命中范围比画出来的圆稍大', () => {
  const pin = { x: 10, y: 10 }
  assert.deepEqual(badgeCenter(pin, 1), { x: 10 + BADGE_BASE_OFFSET, y: 10 - BADGE_BASE_OFFSET })
  assert.deepEqual(badgeCenter(pin, 2), { x: 10 + BADGE_BASE_OFFSET / 2, y: 10 - BADGE_BASE_OFFSET / 2 })
  assert.equal(badgeHitRadius(1), BADGE_BASE_RADIUS * BADGE_HIT_FACTOR)
  assert.ok(badgeHitRadius(1) > BADGE_BASE_RADIUS, '可点范围必须大于视觉半径')
})
