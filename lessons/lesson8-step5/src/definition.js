import { toDefinition as baseToDefinition } from '../../lesson8-step1/src/definition.js'

const OUTLINE_PADDING = 4

function boundsOf(points) {
  if (!points.length) return null
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const left = Math.min(...xs) - OUTLINE_PADDING
  const top = Math.min(...ys) - OUTLINE_PADDING
  const right = Math.max(...xs) + OUTLINE_PADDING
  const bottom = Math.max(...ys) + OUTLINE_PADDING
  return { x: left, y: top, width: right - left, height: bottom - top }
}

function recropViewBox(svgText, body) {
  const viewBox = `${body.x} ${body.y} ${body.width} ${body.height}`
  if (/\bviewBox\s*=\s*"/.test(svgText)) {
    return svgText.replace(/\bviewBox\s*=\s*"[^"]*"/, `viewBox="${viewBox}"`)
  }
  return svgText.replace(/<svg\b/, `<svg viewBox="${viewBox}"`)
}

export function toDefinition(model, name, extras = {}) {
  const base = baseToDefinition(model, name, extras)
  const body = boundsOf(base.snapOutline)
  if (!body) return base

  return {
    ...base,
    size: { width: body.width, height: body.height },
    background: base.background
      ? { ...base.background, svgText: recropViewBox(base.background.svgText, body) }
      : null,
    snapOutline: base.snapOutline.map((point) => ({ x: point.x - body.x, y: point.y - body.y })),
    primitives: base.primitives.map((primitive) => ({
      ...primitive,
      x: primitive.x - body.x,
      y: primitive.y - body.y,
    })),
    pins: base.pins.map((pin) => ({
      ...pin,
      u: (pin.u * base.size.width - body.x) / body.width,
      v: (pin.v * base.size.height - body.y) / body.height,
    })),
  }
}
