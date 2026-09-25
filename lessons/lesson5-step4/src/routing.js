const vectors = {
  left: [-1, 0],
  right: [1, 0],
  top: [0, -1],
  bottom: [0, 1],
}

function lead(point, distance = 30) {
  const [dx, dy] = vectors[point.direction] || [0, 0]
  return { x: point.x + dx * distance, y: point.y + dy * distance }
}

export function routeOrthogonal(source, target) {
  const start = lead(source)
  const end = lead(target)
  if (source.direction === 'left' || source.direction === 'right') {
    const middleX = (start.x + end.x) / 2
    return [source, start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end, target]
  }
  const middleY = (start.y + end.y) / 2
  return [source, start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end, target]
}
