let nextDefinitionId = 1

export function toDefinition(model, name, extras = {}) {
  return {
    id: `definition-${nextDefinitionId++}`,
    name,
    size: { width: model.width, height: model.height },
    background: model.background ? { ...model.background } : null,
    snapPathData: extras.snapPathData || null,
    snapOutline: model.snapOutline.map((point) => ({ x: point.x, y: point.y })),
    primitives: [...model.primitives.values()].map((primitive) => ({ ...primitive })),
    pins: model.pins.map((pin) => ({
      id: pin.id,
      u: pin.u,
      v: pin.v,
      direction: pin.direction,
    })),
  }
}
