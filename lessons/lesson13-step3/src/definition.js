// 元件定义：裁切到真实外形，并且把引脚的**身份**带下去。
// （第 8 课的 toDefinition 只带 { id, u, v, direction }，身份会丢在门口）

const OUTLINE_PADDING = 4

let nextDefinitionId = 1

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
  const outline = model.snapOutline.map((point) => ({ x: point.x, y: point.y }))
  const body = boundsOf(outline)

  const width = body ? body.width : model.width
  const height = body ? body.height : model.height
  const shiftX = body ? body.x : 0
  const shiftY = body ? body.y : 0

  return {
    id: `definition-${nextDefinitionId++}`,
    name,
    size: { width, height },
    background: model.background
      ? {
          ...model.background,
          svgText: body ? recropViewBox(model.background.svgText, body) : model.background.svgText,
        }
      : null,
    snapPathData: extras.snapPathData || null,
    snapOutline: outline.map((point) => ({ x: point.x - shiftX, y: point.y - shiftY })),
    primitives: [...model.primitives.values()].map((primitive) => ({
      ...primitive,
      x: primitive.x - shiftX,
      y: primitive.y - shiftY,
    })),
    pins: model.pins.map((pin) => ({
      id: pin.id,
      name: pin.name,
      kind: pin.kind,
      // 裁切之后重新归一化：引脚跟着元件一起挪，位置不能飘
      u: (pin.x - shiftX) / width,
      v: (pin.y - shiftY) / height,
      direction: pin.direction,
      angle: pin.angle,
    })),
  }
}
