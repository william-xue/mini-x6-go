const OUTWARD = {
  left: [-1, 0],
  right: [1, 0],
  top: [0, -1],
  bottom: [0, 1],
}

const LEAD = 18

function leadOut(point) {
  const direction = OUTWARD[point.direction]
  if (!direction) return null
  return { x: point.x + direction[0] * LEAD, y: point.y + direction[1] * LEAD }
}

function dedupe(points) {
  return points.filter((point, index) => (
    index === 0
    || Math.abs(points[index - 1].x - point.x) > 1e-9
    || Math.abs(points[index - 1].y - point.y) > 1e-9
  ))
}

export function routeEdge(source, target) {
  const from = leadOut(source)
  const to = leadOut(target)
  if (!from || !to) {
    return [{ x: source.x, y: source.y }, { x: target.x, y: target.y }]
  }

  const start = { x: source.x, y: source.y }
  const end = { x: target.x, y: target.y }

  if (source.direction === 'left' || source.direction === 'right') {
    const middleX = (from.x + to.x) / 2
    return dedupe([start, from, { x: middleX, y: from.y }, { x: middleX, y: to.y }, to, end])
  }

  const middleY = (from.y + to.y) / 2
  return dedupe([start, from, { x: from.x, y: middleY }, { x: to.x, y: middleY }, to, end])
}
