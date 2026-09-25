export function screenToWorld(screen, viewport) {
  return {
    x: (screen.x - viewport.x) / viewport.zoom,
    y: (screen.y - viewport.y) / viewport.zoom,
  }
}

export function worldToScreen(world, viewport) {
  return {
    x: world.x * viewport.zoom + viewport.x,
    y: world.y * viewport.zoom + viewport.y,
  }
}

export function zoomAt(screen, viewport, factor, minZoom = 0.25, maxZoom = 4) {
  const world = screenToWorld(screen, viewport)
  const zoom = Math.min(Math.max(viewport.zoom * factor, minZoom), maxZoom)
  return {
    zoom,
    x: screen.x - world.x * zoom,
    y: screen.y - world.y * zoom,
  }
}
