import test from 'node:test'
import assert from 'node:assert/strict'
import {
  decodeSvgDataUri,
  meetRect,
  meetTransform,
  parseViewBox,
  rectPoints,
  rectShape,
} from '../src/index.js'

const near = (actual, expected, tol = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < tol, `${actual} 应约等于 ${expected}`)

test('viewBox 解析：能用的才认', () => {
  assert.deepEqual(parseViewBox('0 0 200 100'), { x: 0, y: 0, width: 200, height: 100 })
  assert.deepEqual(parseViewBox('10, 20, 30, 40'), { x: 10, y: 20, width: 30, height: 40 })
  assert.equal(parseViewBox('0 0 0 100'), null, '宽为 0 不算')
  assert.equal(parseViewBox('0 0 100'), null, '个数不对不算')
  assert.equal(parseViewBox('乱七八糟'), null)
  assert.equal(parseViewBox(null), null)
})

test('meet 换算必须和浏览器给的 getCTM 对上', () => {
  // 13.1 里实测过：素材 viewBox "0 0 200 100" 装进 868×420 的画布，
  // 浏览器 getCTM 给的是 a=4.200 e=14.000 f=0.000。这里必须求出同一组数，
  // 否则 13.4 解析出来的图形会和屏幕上看到的错位。
  const transform = meetTransform(parseViewBox('0 0 200 100'), 868, 420)
  near(transform.scale, 4.2)
  near(transform.offsetX, 14)
  near(transform.offsetY, 0)

  assert.equal(meetTransform(null, 100, 100), null)
  assert.equal(meetTransform(parseViewBox('0 0 10 10'), 0, 100), null, '盒子尺寸无效时不算')
})

test('矩形映射过去还是矩形', () => {
  const transform = meetTransform(parseViewBox('0 0 200 100'), 868, 420)
  const whole = meetRect(transform, { x: 0, y: 0, width: 200, height: 100 })
  near(whole.x, 14)
  near(whole.y, 0)
  near(whole.width, 840)
  near(whole.height, 420)

  const small = meetRect(transform, { x: 20, y: 10, width: 40, height: 20 })
  near(small.x, 98)
  near(small.y, 42)
  near(small.width, 168)
  near(small.height, 84)
})

test('外接矩形退路：四条边、首尾重合、长度正确', () => {
  const points = rectPoints(10, 20, 30, 40)
  assert.equal(points.length, 5)
  assert.deepEqual(points[0], { x: 10, y: 20 })
  assert.deepEqual(points[4], { x: 10, y: 20 }, '首尾重合 → 会被判成闭合轮廓，朝外方向才对')

  const shape = rectShape({ id: 'im-1', tag: 'image', x: 10, y: 20, width: 30, height: 40, source: 'image-bbox' })
  assert.equal(shape.length, 140)
  assert.equal(shape.approximate, true)
  assert.equal(shape.source, 'image-bbox')
  assert.equal(shape.points.length, 5)
  assert.equal(shape.closed, undefined, '开闭由几何事实判，不预置字段')
})

test('内嵌 SVG 的 data URI 能解开，位图和外链解不了', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'
  assert.equal(decodeSvgDataUri(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`), svg)
  assert.equal(decodeSvgDataUri(`data:image/svg+xml;base64,${btoa(svg)}`), svg)
  assert.equal(decodeSvgDataUri(`data:image/svg+xml,${encodeURIComponent(svg)}`), svg, '没有 charset 也要认')
  assert.equal(decodeSvgDataUri('data:image/png;base64,iVBORw0KGgo='), null, '位图不是内嵌 SVG')
  assert.equal(decodeSvgDataUri('https://example.com/a.svg'), null, '外链要异步取，本课不解')
  assert.equal(decodeSvgDataUri(''), null)
})
