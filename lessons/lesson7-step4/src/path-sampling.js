export function samplePath(path, step = 6) {
  const length = path.getTotalLength()
  const points = []
  for (let distance = 0; distance < length; distance += step) {
    const point = path.getPointAtLength(distance)
    points.push({ x: point.x, y: point.y })
  }
  const end = path.getPointAtLength(length)
  const first = points[0]
  if (!first || Math.hypot(end.x - first.x, end.y - first.y) > 0.01) {
    points.push({ x: end.x, y: end.y })
  }
  return points
}
