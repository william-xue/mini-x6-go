let nextId = 1

function distanceToSegment(x, y, endX, endY) {
  const lengthSquared = endX * endX + endY * endY
  if (!lengthSquared) return Math.hypot(x, y)
  const t = Math.max(0, Math.min(1, (x * endX + y * endY) / lengthSquared))
  return Math.hypot(x - t * endX, y - t * endY)
}

export class DesignerModel {
  constructor() {
    this.primitives = new Map()
    this.listeners = new Map()
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(handler)
  }

  emit(event, value) {
    for (const handler of this.listeners.get(event) || []) handler(value)
  }

  addPrimitive(kind, x, y) {
    const geometry = {
      rect: { width: 120, height: 70 },
      circle: { r: 42 },
      ellipse: { rx: 65, ry: 38 },
      line: { endX: 120, endY: 0 },
    }[kind]
    const primitive = { id: `primitive-${nextId++}`, kind, x, y, ...geometry }
    this.primitives.set(primitive.id, primitive)
    this.emit('primitive:added', primitive)
    return primitive
  }

  movePrimitive(id, x, y) {
    const primitive = this.primitives.get(id)
    primitive.x = x
    primitive.y = y
    this.emit('primitive:moved', primitive)
  }

  getPrimitiveAt(x, y) {
    return [...this.primitives.values()].reverse().find((primitive) => {
      const localX = x - primitive.x
      const localY = y - primitive.y
      if (primitive.kind === 'rect') {
        return localX >= 0 && localX <= primitive.width && localY >= 0 && localY <= primitive.height
      }
      if (primitive.kind === 'circle') return Math.hypot(localX, localY) <= primitive.r
      if (primitive.kind === 'ellipse') {
        return (localX / primitive.rx) ** 2 + (localY / primitive.ry) ** 2 <= 1
      }
      return distanceToSegment(localX, localY, primitive.endX, primitive.endY) <= 8
    }) || null
  }
}
