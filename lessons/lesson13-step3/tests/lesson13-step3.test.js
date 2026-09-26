import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cardinal4,
  kindsCompatible,
  nearestOnShape,
  outwardNormal,
  pointsFormClosedLoop,
  signedAreaTwice,
  validateConnection,
} from '../src/index.js'

// 带凹槽的外壳（与演示素材同一条路径）：M140 60 H730 V240 H340 V300 H730 V380 H140 Z
const SLOT = [
  { x: 140, y: 60 }, { x: 730, y: 60 }, { x: 730, y: 240 }, { x: 340, y: 240 },
  { x: 340, y: 300 }, { x: 730, y: 300 }, { x: 730, y: 380 }, { x: 140, y: 380 },
]

test('绕向：鞋带和的两倍，符号就是方向', () => {
  assert.equal(signedAreaTwice(SLOT), 330800)
  const reversed = [...SLOT].reverse()
  assert.equal(signedAreaTwice(reversed), -330800, '反向绕行符号翻转')
})

test('开闭判定：首尾两点重合就算闭合，不用看 Z 标记', () => {
  assert.equal(pointsFormClosedLoop([...SLOT, SLOT[0]]), true)
  assert.equal(pointsFormClosedLoop(SLOT), false, '首尾不重合 → 开放')
  assert.equal(pointsFormClosedLoop([{ x: 0, y: 0 }, { x: 1, y: 1 }]), false, '点数不够')
})

test('外法线靠绕向推导：凸边、凹槽内壁都对', () => {
  // Math.round(-0) 会得到 -0，和 0 用 deepEqual 不等 —— 归一化一下
  const r = (n) => ({ x: Math.round(n.x) + 0, y: Math.round(n.y) + 0 })

  const top = outwardNormal(SLOT, 0, true)
  assert.deepEqual(r(top), { x: 0, y: -1 }, '上边朝外 = 上')

  const rightWall = outwardNormal(SLOT, 1, true)
  assert.deepEqual(r(rightWall), { x: 1, y: 0 }, '右外壁朝外 = 右')

  // 这一段是 13.1 算反的那一条：凹槽内壁 x=340（材料在它左边），正确朝外是 +x
  const slotWall = outwardNormal(SLOT, 3, true)
  assert.deepEqual(
    r(slotWall),
    { x: 1, y: 0 },
    '凹槽内壁朝外 = 右（13.1 的"远离质心"在这里会给出 -x）',
  )

  const slotBottom = outwardNormal(SLOT, 4, true)
  assert.deepEqual(r(slotBottom), { x: 0, y: -1 }, '槽底朝外 = 上')

  // 同一堵墙：不管轮廓按哪个方向绕，朝外都必须是同一个方向。
  // 因为边向量反向时垂线跟着反向、绕向符号也反向，两次翻转正好抵消 —— 这就是"绕向法"比"质心法"稳的地方。
  const reversed = [...SLOT].reverse()
  const sameWall = outwardNormal(reversed, reversed.indexOf(SLOT[4]), true)
  assert.deepEqual(r(sameWall), { x: 1, y: 0 }, '轮廓反着绕，同一堵墙的朝外方向不该跟着翻')
})

test('开放折线：不再凭空多出一段"末点→首点"', () => {
  const open = [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 0 }]
  const probe = { x: 100, y: 30 }

  // 当成闭合处理时（13.1 的老行为）：会吸到底部那条并不存在的边 y=0
  const asClosed = nearestOnShape(open, probe, true)
  assert.equal(asClosed.point.y, 0)
  assert.equal(asClosed.distance, 30)

  // 正确做法：只在真实存在的两段里找
  const asOpen = nearestOnShape(open, probe, false)
  assert.ok(Math.abs(asOpen.distance - 49.497) < 0.01, `实际 ${asOpen.distance}`)
  assert.equal(asOpen.point.y, 65)
  assert.equal(asOpen.direction, null, '开放折线不给"朝外方向" —— 它两边都是外面')
  assert.equal(asOpen.angle !== null, true, '但连续角度仍然给出，供路由自己决定怎么用')
})

test('把连续角度收成 4 个基数档位', () => {
  assert.equal(cardinal4(0), 'right')
  assert.equal(cardinal4(Math.PI / 2), 'bottom')
  assert.equal(cardinal4(Math.PI), 'left')
  assert.equal(cardinal4(-Math.PI / 2), 'top')
  assert.equal(cardinal4(0.12), 'right')
  assert.equal(cardinal4(Math.PI / 4 + 0.01), 'bottom', '45° 就近落到下')
  assert.equal(cardinal4(null), null)
})

test('类型相容规则', () => {
  assert.equal(kindsCompatible('input', 'output'), true)
  assert.equal(kindsCompatible('output', 'input'), true)
  assert.equal(kindsCompatible('bidirectional', 'input'), true)
  assert.equal(kindsCompatible('output', 'output'), false, '输出接输出不行')
  assert.equal(kindsCompatible('input', 'input'), false, '输入接输入也不行')
  assert.equal(kindsCompatible('bidirectional', 'bidirectional'), true)
})

const PINS = {
  'A:p1': { name: 'P1', kind: 'output' },
  'A:p2': { name: 'P2', kind: 'input' },
  'A:p3': { name: 'P3', kind: 'output' },
  'B:q1': { name: 'Q1', kind: 'input' },
  'B:q2': { name: 'Q2', kind: 'output' },
}

const lookup = (terminal) => PINS[`${terminal.instanceId}:${terminal.portId}`] || null
const at = (instanceId, portId) => ({ instanceId, portId })

test('连接校验：自连、重复连、类型冲突都挡住', () => {
  const self = validateConnection({ source: at('A', 'p1'), target: at('A', 'p1'), lookup })
  assert.equal(self.ok, false)
  assert.match(self.reason, /自己/)

  const clashing = validateConnection({ source: at('A', 'p1'), target: at('B', 'q2'), lookup })
  assert.equal(clashing.ok, false, '输出接输出')
  assert.match(clashing.reason, /类型冲突/)
  assert.match(clashing.reason, /输出/)

  const sameKind = validateConnection({ source: at('A', 'p2'), target: at('A', 'p2'), lookup })
  assert.equal(sameKind.ok, false)

  const good = validateConnection({ source: at('A', 'p1'), target: at('B', 'q1'), lookup })
  assert.equal(good.ok, true)
  assert.match(good.reason, /P1（输出）→ Q1（输入）/)
})

test('连接校验：重复连正反两个方向都算重复', () => {
  const edges = [{ id: 'edge-1', source: at('A', 'p1'), target: at('B', 'q1') }]
  const forward = validateConnection({ source: at('A', 'p1'), target: at('B', 'q1'), edges, lookup })
  assert.equal(forward.ok, false)
  assert.match(forward.reason, /已经有一条线/)

  const backward = validateConnection({ source: at('B', 'q1'), target: at('A', 'p1'), edges, lookup })
  assert.equal(backward.ok, false, '反过来连也算同一条')
})

test('连接校验：定义里找不到那个引脚就说清楚，不硬连', () => {
  const missing = validateConnection({ source: at('A', 'p1'), target: at('Z', 'zz'), lookup })
  assert.equal(missing.ok, false)
  assert.match(missing.reason, /找不到了/)
})
