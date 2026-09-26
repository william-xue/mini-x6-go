// 素材 SVG 的解析与挂载。
//
// 为什么必须"挂进文档"：
//   实测（Chrome）—— DOMParser 解析出来但从未挂进文档的 SVG 图形，
//   getTotalLength() 会抛 InvalidStateError，getBBox() 返回 0x0。
//   浏览器只肯对"已经在文档里"的图形算几何。
//
// 为什么挂在 <defs> 里：
//   defs 里的东西按规范不渲染、不占位（getBoundingClientRect 是 0x0）、
//   不参与命中测试，但几何 API（getTotalLength / getPointAtLength / getCTM）完全可用。

const DEFAULT_VIEWBOX_SIDE = 324

export function parseMaterial(svgText) {
  const parsed = new DOMParser().parseFromString(String(svgText ?? ''), 'image/svg+xml')
  if (parsed.querySelector('parsererror')) {
    return { error: '素材不是合法 SVG：浏览器解析失败', root: null }
  }
  const root = parsed.documentElement
  if (!root || root.tagName.toLowerCase() !== 'svg') {
    return { error: `素材的根元素是 <${root ? root.tagName.toLowerCase() : '空'}>，不是 <svg>`, root: null }
  }
  return { error: null, root }
}

/**
 * 把素材挂进 defsHost，并用**和 <image preserveAspectRatio="xMidYMid meet"> 完全相同**
 * 的定位参数（x / y / width / height / preserveAspectRatio）。
 *
 * 这样浏览器算出来的 getCTM() 就是"素材坐标 → 画布坐标"，
 * 我们一行缩放平移换算都不用写，而且和屏幕上显示的那张图保证一致。
 */
export function mountMaterial(defsHost, parsedRoot, { width, height }) {
  const element = document.importNode(parsedRoot, true)

  if (!element.getAttribute('viewBox')) {
    element.setAttribute('viewBox', fallbackViewBox(element, width, height))
  }
  element.setAttribute('x', '0')
  element.setAttribute('y', '0')
  element.setAttribute('width', String(width))
  element.setAttribute('height', String(height))
  element.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  element.setAttribute('data-material-root', '')

  defsHost.replaceChildren(element)
  return element
}

export function unmountMaterial(defsHost) {
  defsHost.replaceChildren()
}

function fallbackViewBox(element, width, height) {
  const declared = Number(element.getAttribute('width'))
  const declaredHeight = Number(element.getAttribute('height'))
  const w = Number.isFinite(declared) && declared > 0 ? declared : width || DEFAULT_VIEWBOX_SIDE
  const h = Number.isFinite(declaredHeight) && declaredHeight > 0 ? declaredHeight : height || DEFAULT_VIEWBOX_SIDE
  return `0 0 ${w} ${h}`
}
