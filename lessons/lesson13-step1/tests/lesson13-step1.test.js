import test from 'node:test'
import assert from 'node:assert/strict'
import {
  adaptiveStep,
  areaOf,
  classifyTag,
  invisibilityReason,
  isBackgroundLike,
  nearestAcrossShapes,
  pickPrimaryShape,
  sampleCountFor,
  shapeBounds,
} from '../src/index.js'

test('采样间隔按周长分摊，两头都不失真', () => {
  // 小件：算出来比下限还小 → 用下限
  assert.equal(adaptiveStep(100, 240, 2), 2)
  assert.equal(adaptiveStep(480, 240, 2), 2)
  // 大件：按周长分摊，步长跟着变大
  assert.equal(adaptiveStep(2400, 240, 2), 10)
  // 下限可调
  assert.equal(adaptiveStep(2400, 240, 12), 12)
  // 异常输入回落到下限
  assert.equal(adaptiveStep(0, 240, 2), 2)
  assert.equal(adaptiveStep(Number.NaN, 240, 2), 2)
})

test('采样点数按间隔算出，末尾一定落在终点', () => {
  assert.equal(sampleCountFor(2400, 10), 240)
  assert.equal(sampleCountFor(100, 2), 50)
  assert.equal(sampleCountFor(0, 2), 1)
})

test('能读的标签和读不了的标签分得清楚', () => {
  for (const tag of ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line']) {
    assert.equal(classifyTag(tag).kind, 'geometry', tag)
  }
  assert.equal(classifyTag('LINE').kind, 'geometry', '标签大小写不敏感')
  for (const tag of ['image', 'text', 'use', 'g']) {
    const verdict = classifyTag(tag)
    assert.equal(verdict.kind, 'skip', tag)
    assert.ok(verdict.reason.length > 0, `${tag} 必须有理由`)
  }
  assert.ok(classifyTag('image').reason.includes('位图'))
  assert.ok(classifyTag('没见过的东西').reason.includes('没有几何长度'))
})

test('多条轮廓：谁离鼠标近就算谁', () => {
  const shapes = [
    { id: 'left', tag: 'rect', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] },
    { id: 'right', tag: 'polygon', points: [{ x: 300, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 100 }, { x: 300, y: 100 }] },
  ]

  const snapped = nearestAcrossShapes(shapes, { x: 350, y: -30 })
  assert.equal(snapped.shapeId, 'right', '应当落在右边那条上')
  assert.equal(snapped.tag, 'polygon')
  assert.equal(snapped.point.x, 350)
  assert.equal(snapped.point.y, 0)
  assert.equal(snapped.distance, 30)
  assert.equal(snapped.direction, 'top')

  const tooFar = nearestAcrossShapes(shapes, { x: 350, y: -30 }, 10)
  assert.equal(tooFar, null, '两条都超出阈值时返回 null，不硬吸')
})

test('面积与包围盒', () => {
  const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]
  assert.equal(areaOf(square), 100)
  assert.equal(areaOf([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }]), 5000)
  assert.equal(areaOf([{ x: 0, y: 0 }, { x: 5, y: 5 }]), 0, '两个点围不出面积')

  const bounds = shapeBounds([{ x: 1, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 9 }])
  assert.deepEqual(bounds, { x: 1, y: 2, width: 4, height: 7 })
})

test('通铺底色：盖住整个画布的那块被认出来', () => {
  const fullCanvas = [{ x: 0, y: 0 }, { x: 868, y: 0 }, { x: 868, y: 420 }, { x: 0, y: 420 }]
  assert.equal(isBackgroundLike({ points: fullCanvas }, 868, 420), true)

  const small = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]
  assert.equal(isBackgroundLike({ points: small }, 868, 420), false)

  // 刚好六成，不算底色
  const sixty = [{ x: 0, y: 0 }, { x: 868 * 0.8, y: 0 }, { x: 868 * 0.8, y: 420 * 0.75 }, { x: 0, y: 420 * 0.75 }]
  assert.equal(isBackgroundLike({ points: sixty }, 868, 420), false)
  assert.equal(isBackgroundLike({ points: sixty }, 868, 420, 0.5), true, '阈值可调')

  assert.equal(isBackgroundLike({ points: fullCanvas }, 0, 0), false, '画布尺寸无效时不误判')
})

test('主轮廓取围出面积最大的那条', () => {
  const shapes = [
    { id: 'small', tag: 'circle', points: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }, { x: 0, y: 20 }] },
    { id: 'big', tag: 'path', points: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }] },
  ]
  assert.equal(pickPrimaryShape(shapes).id, 'big')
  assert.equal(pickPrimaryShape([]), null)
})

test('看不见的图形必须沿祖先链一起判，只看元素自己会漏判', () => {
  const visible = [{ tag: 'rect', display: 'inline', visibility: 'visible', opacity: '1' }]
  assert.equal(invisibilityReason(visible), null)

  // 踩过的真坑：元素自己没问题，但它所在的组被 display:none 藏了。
  // 实测 getComputedStyle(子元素).display 仍然是 'inline'。
  const insideHiddenGroup = [
    { tag: 'rect', display: 'inline', visibility: 'visible', opacity: '1' },
    { tag: 'g', display: 'none', visibility: 'visible', opacity: '1' },
  ]
  assert.match(invisibilityReason(insideHiddenGroup), /<g>/)
  assert.match(invisibilityReason(insideHiddenGroup), /display:none/)

  // 元素自己被藏
  assert.match(invisibilityReason([{ tag: 'line', display: 'none', visibility: 'visible', opacity: '1' }]), /<line>/)
  // visibility 是继承的，祖先藏了子元素自己也会算成 hidden
  assert.match(invisibilityReason([{ tag: 'rect', display: 'inline', visibility: 'hidden', opacity: '1' }]), /visibility:hidden/)
  // 全透明也算看不见
  assert.match(invisibilityReason([{ tag: 'rect', display: 'inline', visibility: 'visible', opacity: '0' }]), /opacity:0/)
  // 半透明不算
  assert.equal(invisibilityReason([{ tag: 'rect', display: 'inline', visibility: 'visible', opacity: '0.5' }]), null)
})
