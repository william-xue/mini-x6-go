// 13.1 的核心：轮廓不再由人写，而是从素材里"读"出来。
//
// 分工：
//   · 纯函数部分（采样间隔、多图形取最近、面积、底色判定）—— node 里可直接测
//   · 读图部分（问浏览器要长度和点）—— 只在真页面里跑，见 readShapes
//
// 落点算法本次**故意不动**：仍然复用 7.3 的 nearestPointOnOutline，
// 所以单图形素材下，13.1 的落点结果和 7.3/7.5 逐点一致（方便对照验收）。
// 它的毛病（法线靠质心、按闭合折线处理）留给 13.3 一起修。

import { nearestPointOnOutline } from '../../lesson7-step3/src/outline-geometry.js'

// 浏览器愿意回答"自己多长"的标签
export const GEOMETRY_TAGS = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line']

// 不参与落点、但要在诊断里说清楚的标签
export const SKIP_REASONS = {
  image: '位图/外部图片：没有几何长度',
  text: '文字：没有几何长度',
  tspan: '文字片段：没有几何长度',
  use: '引用的符号：本身没有几何长度',
  g: '分组容器：本身没有几何长度',
  svg: '嵌套的根元素：本身没有几何长度',
  foreignObject: 'HTML 容器：没有几何长度',
  symbol: '符号模板：不直接渲染',
  defs: '定义区：不直接渲染',
  clipPath: '裁剪模板：不直接渲染',
  mask: '蒙版模板：不直接渲染',
  marker: '标记模板：不直接渲染',
  pattern: '填充模板：不直接渲染',
}

// 落在这几种容器里的一切，都不直接渲染，直接跳过整棵子树
export const SKIP_SUBTREES = ['defs', 'symbol', 'clipPath', 'mask', 'marker', 'pattern', 'linearGradient', 'radialGradient']

let autoId = 1

// ───────────────────────── 纯函数 ─────────────────────────

export function classifyTag(tag) {
  const name = String(tag || '').toLowerCase()
  if (GEOMETRY_TAGS.includes(name)) return { kind: 'geometry', reason: null }
  return { kind: 'skip', reason: SKIP_REASONS[name] || `${name}：没有几何长度` }
}

/**
 * 采样间隔按"这条边一共多长"自适应。
 * 固定步长在大件上太稀、在小件上太密；按周长分摊才两头都对。
 */
export function adaptiveStep(length, sampleCount = 240, minStep = 2) {
  if (!Number.isFinite(length) || length <= 0) return minStep
  return Math.max(minStep, length / Math.max(1, sampleCount))
}

export function sampleCountFor(length, step) {
  if (!Number.isFinite(length) || length <= 0) return 1
  return Math.max(1, Math.ceil(length / step))
}

/**
 * 多图形落点：每条轮廓各算一次最近点，谁近算谁。
 * 这就是"各种形状都有"能成立的原因——不需要事先知道素材长什么样。
 */
export function nearestAcrossShapes(shapes, point, maxDistance = Number.POSITIVE_INFINITY) {
  let best = null
  for (const shape of shapes) {
    if (!shape || !shape.points || shape.points.length < 2) continue
    const snapped = nearestPointOnOutline(point, shape.points, maxDistance)
    if (!snapped) continue
    if (!best || snapped.distance < best.distance) {
      // 7.3 的返回值是扁平的 {x, y, distance, normal, direction}，这里统一成 {point, ...}
      best = {
        point: { x: snapped.x, y: snapped.y },
        distance: snapped.distance,
        segmentIndex: snapped.segmentIndex,
        normal: snapped.normal,
        direction: snapped.direction,
        shapeId: shape.id,
        tag: shape.tag,
      }
    }
  }
  return best
}

export function shapeBounds(points) {
  if (!points.length) return { x: 0, y: 0, width: 0, height: 0 }
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
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function boundsOfShapes(shapes) {
  return shapeBounds(shapes.flatMap((shape) => shape.points))
}

/** 鞋带公式：这条折线围出的面积（用来挑主轮廓）。绝对值，不关心绕向。 */
export function areaOf(points) {
  if (points.length < 3) return 0
  let sum = 0
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

/**
 * 疑似"铺满画布的底色块"：外接框几乎盖住整个画布。
 * 素材里画一块通铺底色是常见做法，但引脚吸到它边上没有意义。
 */
export function isBackgroundLike(shape, canvasWidth, canvasHeight, threshold = 0.95) {
  if (!(canvasWidth > 0) || !(canvasHeight > 0)) return false
  if (!shape || !shape.points || shape.points.length < 2) return false
  const bounds = shapeBounds(shape.points)
  return (bounds.width * bounds.height) / (canvasWidth * canvasHeight) >= threshold
}

/** 主轮廓 = 围出面积最大的那条（供第 8 课的裁切与高亮使用） */
export function pickPrimaryShape(shapes) {
  let best = null
  let bestArea = -1
  for (const shape of shapes) {
    const area = areaOf(shape.points)
    if (area > bestArea) {
      bestArea = area
      best = shape
    }
  }
  return best
}

/**
 * 这条样式链里，第一层"关掉显示"的写法，就是它看不见的原因。
 *
 * 它被单独抽成纯函数，是因为这里踩过一个真坑：**只看元素自己**会漏判"整组被藏起来"的装饰。
 * 实测 `getComputedStyle(子元素).display` 在被 `display:none` 的组里仍然返回 `'inline'`，
 * 于是整组隐藏的辅助几何会全部变成引脚候选。
 */
export function invisibilityReason(chain) {
  for (const layer of chain) {
    if (layer.display === 'none') return `在 <${layer.tag}> 上 display:none，看不见`
    if (layer.visibility === 'hidden') return `在 <${layer.tag}> 上 visibility:hidden，看不见`
    if (Number(layer.opacity) === 0) return `在 <${layer.tag}> 上 opacity:0，看不见`
  }
  return null
}

// ───────────────────── 需要浏览器的部分 ─────────────────────

/**
 * 读素材：遍历每个图形，问浏览器"你多长""走到 t 在哪"，
 * 并顺手把点从素材坐标换算到画布坐标（换算由 getCTM 给出，我们不做数学）。
 */
export function readShapes(materialRoot, options = {}) {
  const sampleCount = options.sampleCount ?? 240
  const preferredSelector = options.preferredSelector || null
  const includeHidden = options.includeHidden === true
  const ignoreTransform = options.ignoreTransform === true
  // 13.6 的接缝：让调用方给每个形状附加自己的信息（比如"它是不是实心填充"）。
  // 必须在这一层做 —— 因为元素引用只在这里存在，读完就丢了。
  const decorateShape = typeof options.decorateShape === 'function' ? options.decorateShape : null
  const shapes = []
  const skipped = new Map()
  let hiddenAccepted = 0

  const noteSkip = (tag, reason) => {
    const bucket = skipped.get(tag) || { tag, reason, count: 0 }
    bucket.count += 1
    skipped.set(tag, bucket)
  }

  // order = 文档顺序（同时也是 SVG 的绘制顺序）。13.6 靠它判"谁盖在谁上面"。
  let order = 0
  for (const element of materialRoot.querySelectorAll('*')) {
    order += 1
    const tag = element.tagName.toLowerCase()

    const hiddenBy = hiddenAncestorTag(element, materialRoot)
    if (hiddenBy) {
      noteSkip(tag, `在 <${hiddenBy}> 里，不直接渲染`)
      continue
    }

    const { kind, reason } = classifyTag(tag)
    if (kind !== 'geometry') {
      noteSkip(tag, reason)
      continue
    }

    // 看不见的图形默认不当落点候选。
    // 必须沿祖先链一起看 —— 实测：getComputedStyle(子元素).display 在被
    // display:none 的组里仍然是 'inline'，只看元素自己会漏判整组装饰。
    const chain = styleChainOf(element, materialRoot)
    const invisible = invisibilityReason(chain)
    let hidden = false
    if (invisible) {
      if (!includeHidden) {
        noteSkip(tag, invisible)
        continue
      }
      // 收进来的前提：隐藏写在**祖先**上。
      // 元素自己被 display:none / opacity:0 的，getCTM 会丢掉它自己的 transform
      //（实测 e=0 f=0，本该是 5），落点坐标会静默偏移 —— 不能假装能读。
      const onSelf = element.style.display === 'none' || element.style.opacity === '0'
      if (onSelf) {
        noteSkip(tag, `${invisible}（而且藏在自己身上，坐标会失真，不收）`)
        continue
      }
      hidden = true
      hiddenAccepted += 1
    }

    const shape = measureShape(element, tag, sampleCount, hidden, ignoreTransform)
    if (!shape) {
      noteSkip(tag, '浏览器给不出长度（零长度，或者没有几何 API）')
      continue
    }
    if (preferredSelector && typeof element.matches === 'function' && element.matches(preferredSelector)) {
      shape.selected = true
    }
    shapes.push(decorateShape ? { ...shape, ...decorateShape(element, shape, order) } : shape)
  }

  return { shapes, skipped: [...skipped.values()], hiddenAccepted }
}

/**
 * 把一个"在图形自己用户空间里的点"换算到画布坐标。
 *
 * 这是全仓库**唯一**使用 getCTM 的地方，也是 13.5 要对比的那一行：
 *   ignoreTransform = true → 直接放行，假装没有 getCTM（模拟前 12 课的做法）
 * 两种模式走的是同一段采样代码，差别只在这三行。
 */
export function applyCtm(ctm, point, ignoreTransform = false) {
  if (ignoreTransform || !ctm) return { x: point.x, y: point.y }
  return {
    x: ctm.a * point.x + ctm.c * point.y + ctm.e,
    y: ctm.b * point.x + ctm.d * point.y + ctm.f,
  }
}

function measureShape(element, tag, sampleCount, hidden = false, ignoreTransform = false) {
  let length = 0
  try {
    length = element.getTotalLength()
  } catch (error) {
    return null
  }
  if (!Number.isFinite(length) || length <= 0) return null

  const ctm = typeof element.getCTM === 'function' ? element.getCTM() : null
  // 正常模式下拿不到矩阵就放弃；对比模式（ignoreTransform）允许没有矩阵
  if (!ctm && !ignoreTransform) return null

  const step = adaptiveStep(length, sampleCount)
  const count = sampleCountFor(length, step)
  const points = []
  for (let i = 0; i <= count; i += 1) {
    let local
    try {
      local = element.getPointAtLength((length * i) / count)
    } catch (error) {
      return null
    }
    points.push(applyCtm(ctm, local, ignoreTransform))
  }

  return {
    id: element.getAttribute('id') || `${tag}-${autoId++}`,
    tag,
    length: round(length),
    step: round(step),
    hidden,
    points: dedupePoints(points),
  }
}

function hiddenAncestorTag(element, materialRoot) {
  let node = element.parentElement
  while (node && node !== materialRoot) {
    const tag = node.tagName.toLowerCase()
    if (SKIP_SUBTREES.includes(tag)) return tag
    node = node.parentElement
  }
  return null
}

/**
 * 从元素自己一路往外，把每一层的 display / visibility / opacity 收集成一条链。
 * 停在素材根（不含），免得把宿主 <defs> 算进去。
 */
function styleChainOf(element, materialRoot) {
  const view = element.ownerDocument && element.ownerDocument.defaultView
  if (!view) return []
  const chain = []
  let node = element
  while (node && node !== materialRoot) {
    const style = view.getComputedStyle(node)
    chain.push({
      tag: node.tagName.toLowerCase(),
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
    })
    node = node.parentElement
  }
  return chain
}

function dedupePoints(points) {
  return points.filter((point, index) => (
    index === 0
    || Math.abs(points[index - 1].x - point.x) > 1e-9
    || Math.abs(points[index - 1].y - point.y) > 1e-9
  ))
}

function round(value) {
  return Math.round(value * 100) / 100
}
