export function moveSnapshot(snapshot, dx, dy) {
  return snapshot.map((item) => ({
    id: item.id,
    x: item.x + dx,
    y: item.y + dy,
  }))
}

export function getSelectionBounds(nodes) {
  return {
    left: Math.min(...nodes.map((node) => node.x)),
    top: Math.min(...nodes.map((node) => node.y)),
    right: Math.max(...nodes.map((node) => node.x + node.width)),
    bottom: Math.max(...nodes.map((node) => node.y + node.height)),
  }
}

export function pointInBounds(point, bounds) {
  return point.x >= bounds.left && point.x <= bounds.right
    && point.y >= bounds.top && point.y <= bounds.bottom
}
