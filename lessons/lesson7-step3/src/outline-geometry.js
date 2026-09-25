function projectToSegment(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
    : 0
  const projected = { x: start.x + t * dx, y: start.y + t * dy }
  return { point: projected, distance: Math.hypot(point.x - projected.x, point.y - projected.y), dx, dy }
}

function cardinalDirection(normal) {
  if (Math.abs(normal.x) >= Math.abs(normal.y)) return normal.x >= 0 ? 'right' : 'left'
  return normal.y >= 0 ? 'bottom' : 'top'
}

export function nearestPointOnOutline(point, outline, maxDistance = 40) {
  const center = {
    x: outline.reduce((sum, item) => sum + item.x, 0) / outline.length,
    y: outline.reduce((sum, item) => sum + item.y, 0) / outline.length,
  }
  let best = null
  for (let index = 0; index < outline.length; index += 1) {
    const candidate = projectToSegment(point, outline[index], outline[(index + 1) % outline.length])
    if (!best || candidate.distance < best.distance) best = { ...candidate, segmentIndex: index }
  }
  if (!best || best.distance > maxDistance) return null

  const length = Math.hypot(best.dx, best.dy) || 1
  let normal = { x: best.dy / length, y: -best.dx / length }
  const awayFromCenter = { x: best.point.x - center.x, y: best.point.y - center.y }
  if (normal.x * awayFromCenter.x + normal.y * awayFromCenter.y < 0) {
    normal = { x: -normal.x, y: -normal.y }
  }
  return {
    x: best.point.x,
    y: best.point.y,
    distance: best.distance,
    segmentIndex: best.segmentIndex,
    normal,
    direction: cardinalDirection(normal),
  }
}
