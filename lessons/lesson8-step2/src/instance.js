let nextInstanceId = 1

export function instantiate(definition, options = {}) {
  const scale = options.scale ?? 1
  return {
    id: options.id ?? `instance-${nextInstanceId++}`,
    definitionId: definition.id,
    name: definition.name,
    x: options.x ?? 0,
    y: options.y ?? 0,
    scale,
    width: definition.size.width * scale,
    height: definition.size.height * scale,
    ports: definition.pins.map((pin) => ({ ...pin })),
  }
}

export function getPortPoint(instance, portId) {
  const port = instance.ports.find((item) => item.id === portId)
  if (!port) return null
  return {
    x: instance.x + port.u * instance.width,
    y: instance.y + port.v * instance.height,
    direction: port.direction,
  }
}
