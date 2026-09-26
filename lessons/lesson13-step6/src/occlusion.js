// 13.6 的核心：**谁被谁盖住了**。
//
// 起因是一个实测出来的真缺陷（13.5 的实测记录里也有它）：
// 素材里两个图形重叠时，下面那个露不出来的边**照样能吸引脚** ——
// 你点在看得见的填充上，引脚却落到一条几百像素外、屏幕上看不见的线上。
//
// 修法不是"只留最外缘"（那是布尔并集干的事，会把看得见的内部边一起删掉），
// 而是只删**看不见的那些边**：
//   ① 这个点是不是落在**别的、画得比我晚的**图形的实心填充里面？
//   ② 是 → 这条边被盖住了，标 buried

/**
 * 颜色的 alpha 通道。'#fff' / 'red' / 'rgb(...)' 都当 1，
 * 'rgba(...,0)' 或 'transparent' 才是 0。
 */
export function alphaOfColor(color) {
  if (!color) return 0
  const text = String(color).trim().toLowerCase()
  if (text === 'none' || text === 'transparent') return 0
  const match = /rgba?\(([^)]+)\)/.exec(text)
  if (!match) return 1
  const parts = match[1].split(/[,/]/).map((item) => item.trim()).filter(Boolean)
  if (parts.length < 4) return 1
  const alpha = Number.parseFloat(parts[3])
  return Number.isFinite(alpha) ? alpha : 1
}

/**
 * 这个元素会不会"挡住"别的东西？
 *
 * 只有**不透明的填充**才挡得住 —— 描边、无填充、半透明都不算（看得见就不该算盖住）。
 * 参数传 getComputedStyle 的结果（fill / opacity 都是继承来的，必须用计算值）。
 */
export function isSolidFill(style) {
  if (!style) return false
  if (style.display === 'none' || style.visibility === 'hidden') return false
  const fillAlpha = alphaOfColor(style.fill)
  if (fillAlpha <= 0) return false
  const fillOpacity = Number.parseFloat(style.fillOpacity)
  const opacity = Number.parseFloat(style.opacity)
  const effective = fillAlpha
    * (Number.isFinite(fillOpacity) ? fillOpacity : 1)
    * (Number.isFinite(opacity) ? opacity : 1)
  // 用户 2026-09-26 定的规则：半透明不算遮挡（看得见就不该算盖住）。
  // 所以只有"几乎完全不透明"才算。
  return effective > 0.999
}

export function boundsOfPoints(points) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const point of points) {
    if (point.x < minX) minX = point.x
    if (point.y < minY) minY = point.y
    if (point.x > maxX) maxX = point.x
    if (point.y > maxY) maxY = point.y
  }
  return { minX, minY, maxX, maxY }
}

export function pointInBounds(point, bounds) {
  return point.x >= bounds.minX && point.x <= bounds.maxX
    && point.y >= bounds.minY && point.y <= bounds.maxY
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
    : 0
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy))
}

/** 点到这条折线的最小距离。只用来兜"点正落在边界上"这个退化情况。 */
function distanceToRing(point, ring) {
  let best = Infinity
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const distance = distanceToSegment(point, ring[j], ring[i])
    if (distance < best) best = distance
  }
  return best
}

/** 边界容差：这个距离以内算"落在遮挡者身上"，当成被盖住。 */
export const BOUNDARY_EPSILON = 0.75

/**
 * 点 P 是不是被这个遮挡者盖住了。
 *
 * 两种情况：
 *   ① P 在遮挡者的区域**里面**（射线法）
 *   ② P 正好落在遮挡者的**边界上**（距离 ≤ 容差）
 *
 * 为什么必须有 ②：实测两个完全重合的矩形，下面那个的 21 个采样点里只有 10 个被射线法
 * 判成"在里面" —— 因为点正落在边界上时射线法没有答案，结果随半开区间规则随机偏。
 * 共边（两个矩形贴在一起）同理。不加容差，画面上会出现"一半灰一半紫"的花斑，
 * 而且每次重读结果还可能不一样。
 */
export function isCoveredBy(point, occluder, epsilon = BOUNDARY_EPSILON) {
  if (!pointInBounds(point, occluder.bounds)) return false
  if (pointInRing(point, occluder.shape.points)) return true
  if (!(epsilon > 0)) return false
  return distanceToRing(point, occluder.shape.points) <= epsilon
}

/**
 * 射线法：点是否在这条折线围成的区域里。
 * 用半开区间规则 `(a.y > y) !== (b.y > y)`，所以点正好落在边上时结果也是确定的。
 */
export function pointInRing(point, ring) {
  if (!ring || ring.length < 3) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i]
    const b = ring[j]
    if ((a.y > point.y) === (b.y > point.y)) continue
    const crossingX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    if (point.x < crossingX) inside = !inside
  }
  return inside
}

/**
 * 给每条轮廓的每个点打 `buried` 标记。
 *
 * 遮挡规则只有一条，但它一句话说清了：
 *   **一个图形 j 挡住图形 i 的点 P  ⟺  j 有实心填充、j 画在 i 后面、且 P 落在 j 的区域里**
 *
 * "画在后面"= 文档顺序更靠后 = SVG 的绘制顺序更靠上。这条规则同时解决了两个问题：
 *   · 自己不会挡住自己（顺序不可能大于自己）—— 凹图形不会被自己埋掉
 *   · 两个重叠图形里，**只有上面那个挡住下面那个**，下面那个挡不住上面那个
 *     （否则"后画的那个可见边"会被误判成被埋，白白丢掉能放引脚的地方）
 *
 * 返回统计，给诊断面板用。
 */
export function markBuriedPoints(shapes, options = {}) {
  const epsilon = options.boundaryEpsilon ?? BOUNDARY_EPSILON
  // 只有"从素材几何里读出来的、带绘制顺序的"图形参与遮挡判定。
  // 位图 / 文字 / use / 内嵌 SVG 解出来的轮廓不带 order（它们的"区域"本来就只有近似），
  // 一律不参与 —— 既不当遮挡者，也不会被误埋。（见 README 的已知局限）
  const participants = shapes.filter((shape) => Number.isFinite(shape.order))

  const occluders = []
  for (const shape of participants) {
    if (!shape.solid) continue
    if (!shape.points || shape.points.length < 3) continue
    occluders.push({ shape, bounds: boundsOfPoints(shape.points), order: shape.order })
  }

  let buriedPoints = 0
  let buriedShapes = 0

  for (const shape of participants) {
    let count = 0
    for (const point of shape.points) {
      let buried = false
      for (const occluder of occluders) {
        if (occluder.order <= shape.order) continue // 只有画在我后面的才挡得住我
        if (isCoveredBy(point, occluder, epsilon)) {
          buried = true
          break
        }
      }
      point.buried = buried
      if (buried) count += 1
    }
    shape.buriedCount = count
    buriedPoints += count
    if (count && count === shape.points.length) buriedShapes += 1
  }

  return {
    buriedPoints,
    buriedShapes,
    totalPoints: participants.reduce((sum, shape) => sum + shape.points.length, 0),
  }
}

/**
 * 把一条轮廓切成若干段"连续可见"的折线。
 * 闭合轮廓如果埋掉中间一段，会被切成两条 —— 这是对的，它们之间那段确实没了。
 * （只用于画图：点铺开成线时不能跨过被埋的点，否则会画出一条不存在的连线。）
 */
export function splitVisibleRuns(points) {
  const runs = []
  let current = []
  for (const point of points) {
    if (point.buried) {
      if (current.length) runs.push(current)
      current = []
      continue
    }
    current.push(point)
  }
  if (current.length) runs.push(current)
  return runs.filter((run) => run.length >= 2)
}
