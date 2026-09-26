// 13.4：把"浏览器没有几何 API 的那些东西"也变成可落点的轮廓。
//
// 要处理的四类：
//   <image> 内嵌 SVG      → 把它解开，读里面**真实的**图形（不是它那个矩形框）
//   <image> 位图          → 没有几何，退成外接矩形
//   <text>                → 没有几何，退成外接矩形
//   <use> 引用符号        → 找到被引用的东西读它，自己补上 use 的 x/y
//   被祖先藏起来的图形     → 几何其实完好（见 13.1 README），收编它们

import { readShapes } from '../../lesson13-step1/src/outline-source.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// ───────────────────────── 纯函数 ─────────────────────────

export function parseViewBox(text) {
  if (!text) return null
  const parts = String(text).trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) return null
  if (parts[2] <= 0 || parts[3] <= 0) return null
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] }
}

/**
 * preserveAspectRatio="xMidYMid meet" 的换算：把 viewBox 等比装进一个盒子，居中。
 * 13.1 里这一步是让浏览器算的；这里到了第二层嵌套，浏览器帮不上了，只能自己算 ——
 * 所以它是本课唯一"手写换算"的地方，也正因如此被抽成纯函数、单独测。
 */
export function meetTransform(viewBox, boxWidth, boxHeight) {
  if (!viewBox || !(boxWidth > 0) || !(boxHeight > 0)) return null
  const scale = Math.min(boxWidth / viewBox.width, boxHeight / viewBox.height)
  return {
    scale,
    offsetX: (boxWidth - viewBox.width * scale) / 2 - viewBox.x * scale,
    offsetY: (boxHeight - viewBox.height * scale) / 2 - viewBox.y * scale,
  }
}

export function applyMeet(transform, point) {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY,
  }
}

/** 一个矩形映射到另一个坐标系后，仍然是矩形 */
export function meetRect(transform, rect) {
  const corner = applyMeet(transform, { x: rect.x, y: rect.y })
  return {
    x: corner.x,
    y: corner.y,
    width: rect.width * transform.scale,
    height: rect.height * transform.scale,
  }
}

export function rectPoints(x, y, width, height) {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
    { x, y },
  ]
}

/**
 * 退路形状：外接矩形。
 * 首尾点重合 → 会被当成闭合轮廓，法线由绕向推出（右侧一律朝外），所以至少"朝外"是对的。
 */
export function rectShape({ id, tag, x, y, width, height, source, hidden = false }) {
  return {
    id,
    tag,
    length: Math.round(2 * (width + height) * 100) / 100,
    step: 0,
    hidden,
    source,
    approximate: true,
    points: rectPoints(x, y, width, height),
  }
}

/** data:image/svg+xml 解出里面的 SVG 文本；不是这种就直接返回 null */
export function decodeSvgDataUri(href) {
  if (!href) return null
  const match = /^data:image\/svg\+xml(?:;\s*charset=[^;,]+)?(;base64)?,(.*)$/i.exec(href.trim())
  if (!match) return null
  try {
    return match[1] ? atob(match[2]) : decodeURIComponent(match[2])
  } catch (error) {
    return null
  }
}

/** 写字面量坐标用的：只保留两位小数，省得 transform 串长得离谱 */
export function num(value) {
  return Math.round(value * 100) / 100
}

// ───────────────────── 需要浏览器的部分 ─────────────────────

/**
 * 把素材里"读不了的"解析成可落点的轮廓。
 *
 * @param materialRoot  素材根节点（已挂在设计师的 <defs> 里）
 * @param mountHost     与素材根**同级**的一块 <defs>，用来临时安放解析出来的几何。
 *                      同级是关键：这样浏览器给的 getCTM 直接就是"画布坐标"。
 * @param options       { canvasWidth, canvasHeight, sampleCount, includeHidden }
 */
export function resolveUnreadableShapes(materialRoot, mountHost, options = {}) {
  const shapes = []
  const skipped = []
  const note = (tag, reason, count = 1) => skipped.push({ tag, reason, count })

  const materialBox = parseViewBox(materialRoot.getAttribute('viewBox'))
  const toCanvas = meetTransform(materialBox, options.canvasWidth, options.canvasHeight)
  const sampleCount = options.sampleCount ?? 240
  // 13.5 的对比开关：一路穿到所有"读几何"的地方，否则会出现"某个素材两边一样"的假对比
  const ignoreTransform = options.ignoreTransform === true

  if (!toCanvas) {
    note('svg', '素材没有可用的 viewBox，算不出它在画布上的位置，只能跳过')
    return { shapes, skipped }
  }

  /** 元素在**画布坐标**下的外接矩形 */
  const canvasRectOf = (element) => {
    let box
    try {
      box = element.getBBox()
    } catch (error) {
      return null
    }
    if (!box || (box.width === 0 && box.height === 0)) return null
    return meetRect(toCanvas, box)
  }

  const label = (element, index) => element.getAttribute('id') || `${element.tagName.toLowerCase()}-${index}`

  let index = 0
  for (const element of materialRoot.querySelectorAll('image, text, use')) {
    index += 1
    const tag = element.tagName.toLowerCase()
    const rect = canvasRectOf(element)

    if (tag === 'image') {
      const href = element.getAttribute('href') || element.getAttribute('xlink:href') || ''
      const innerText = decodeSvgDataUri(href)
      if (innerText) {
        const resolved = mountInnerSvg(innerText, element, rect, mountHost, sampleCount, ignoreTransform)
        if (resolved.error) {
          if (rect) shapes.push(rectShape({ id: label(element, index), tag, ...rect, source: 'image-bbox' }))
          note(tag, `内嵌 SVG 解不开（${resolved.error}），退成外接矩形`)
        } else {
          shapes.push(...resolved.shapes)
        }
        continue
      }
      if (!rect) {
        note(tag, '位图且量不出外接矩形，读不了')
        continue
      }
      shapes.push(rectShape({ id: label(element, index), tag, ...rect, source: 'image-bbox' }))
      continue
    }

    if (tag === 'text') {
      if (!rect) {
        note(tag, '文字量不出外接矩形，读不了')
        continue
      }
      shapes.push(rectShape({ id: label(element, index), tag, ...rect, source: 'text-bbox' }))
      continue
    }

    // <use>：找到被引用的东西，自己把 use 的 x/y 补上
    const useHref = element.getAttribute('href') || element.getAttribute('xlink:href') || ''
    const target = useHref.startsWith('#')
      ? materialRoot.querySelector(useHref) || (materialRoot.ownerDocument && materialRoot.ownerDocument.querySelector(useHref))
      : null

    if (!target) {
      if (!rect) {
        note(tag, `引用的目标 ${useHref || '（空）'} 找不到，也量不出外接矩形`)
        continue
      }
      shapes.push(rectShape({ id: label(element, index), tag, ...rect, source: 'use-bbox' }))
      note(tag, `引用的目标 ${useHref || '（空）'} 找不到，退成外接矩形`)
      continue
    }

    const resolved = mountUseTarget(element, target, toCanvas, mountHost, sampleCount, ignoreTransform)
    if (resolved.error) {
      if (rect) shapes.push(rectShape({ id: label(element, index), tag, ...rect, source: 'use-bbox' }))
      note(tag, `被引用的 ${useHref} 读不了（${resolved.error}），退成外接矩形`)
      continue
    }
    shapes.push(...resolved.shapes)
  }

  return { shapes, skipped }
}

function mountInnerSvg(innerText, imageElement, rect, mountHost, sampleCount, ignoreTransform = false) {
  if (!rect) return { error: '算不出这张图在画布上的位置' }

  const parsed = new DOMParser().parseFromString(innerText, 'image/svg+xml')
  if (parsed.querySelector('parsererror')) return { error: '内嵌的 SVG 本身不合法' }

  const inner = document.importNode(parsed.documentElement, true)
  if (inner.tagName.toLowerCase() !== 'svg') return { error: '内嵌内容不是 <svg>' }

  // 与 <image> 一样的定位方式：放在画布坐标的矩形里，用同一套 preserveAspectRatio
  inner.setAttribute('x', String(num(rect.x)))
  inner.setAttribute('y', String(num(rect.y)))
  inner.setAttribute('width', String(num(rect.width)))
  inner.setAttribute('height', String(num(rect.height)))
  inner.setAttribute('preserveAspectRatio', imageElement.getAttribute('preserveAspectRatio') || 'xMidYMid meet')
  if (!inner.getAttribute('viewBox')) {
    const fallback = parseViewBox(`${imageElement.getAttribute('width')} ${imageElement.getAttribute('height')}`)
    inner.setAttribute('viewBox', fallback ? `${fallback.x} ${fallback.y} ${fallback.width} ${fallback.height}` : '0 0 100 100')
  }
  inner.setAttribute('data-resolved-from', 'image')
  mountHost.appendChild(inner)

  const read = readShapes(inner, { sampleCount, ignoreTransform })
  const shapes = read.shapes.map((shape) => ({ ...shape, source: 'image-svg', hidden: false }))
  return { error: null, shapes }
}

function mountUseTarget(useElement, target, toCanvas, mountHost, sampleCount, ignoreTransform = false) {
  const useX = Number(useElement.getAttribute('x') || 0) || 0
  const useY = Number(useElement.getAttribute('y') || 0) || 0

  let symbolScale = 1
  let shiftX = 0
  let shiftY = 0
  const symbolBox = parseViewBox(target.getAttribute('viewBox'))
  const useWidth = Number(useElement.getAttribute('width') || 0) || 0
  const useHeight = Number(useElement.getAttribute('height') || 0) || 0

  if (symbolBox && useWidth > 0 && useHeight > 0) {
    const inner = meetTransform(symbolBox, useWidth, useHeight)
    if (!inner) return { error: 'symbol 的 viewBox 换算不出来' }
    symbolScale = inner.scale
    shiftX = inner.offsetX - symbolBox.x * inner.scale
    shiftY = inner.offsetY - symbolBox.y * inner.scale
  }

  const group = document.createElementNS(SVG_NS, 'g')
  group.setAttribute('data-resolved-from', 'use')
  // 先走"素材 → 画布"，再走"素材坐标下 use 的位置"，最后走 symbol 自己的换算
  group.setAttribute('transform',
    `translate(${num(toCanvas.offsetX)},${num(toCanvas.offsetY)}) scale(${num(toCanvas.scale)})` +
    ` translate(${num(useX)},${num(useY)}) translate(${num(shiftX)},${num(shiftY)}) scale(${num(symbolScale)})`,
  )

  let copied = 0
  for (const child of target.children) {
    const tag = child.tagName.toLowerCase()
    if (tag === 'defs' || tag === 'title' || tag === 'desc') continue
    group.appendChild(document.importNode(child, true))
    copied += 1
  }
  if (!copied) return { error: '被引用的目标里没有可读的图形' }

  mountHost.appendChild(group)

  const read = readShapes(group, { sampleCount, ignoreTransform })
  const shapes = read.shapes.map((shape) => ({ ...shape, source: 'use-target', hidden: false }))
  return { error: null, shapes }
}
