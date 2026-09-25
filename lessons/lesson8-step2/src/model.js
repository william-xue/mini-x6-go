import { instantiate } from './instance.js'

export class AssemblyModel {
  constructor() {
    this.definitions = new Map()
    this.instances = new Map()
    this.listeners = new Map()
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(handler)
  }

  emit(event, value) {
    for (const handler of this.listeners.get(event) || []) handler(value)
  }

  addDefinition(definition) {
    this.definitions.set(definition.id, definition)
    return definition
  }

  addInstance(definition, options) {
    const instance = instantiate(definition, options)
    this.instances.set(instance.id, instance)
    this.emit('instance:added', instance)
    return instance
  }

  getInstanceAt(x, y) {
    return [...this.instances.values()].reverse().find((instance) => (
      x >= instance.x && x <= instance.x + instance.width
      && y >= instance.y && y <= instance.y + instance.height
    )) || null
  }

  moveInstance(id, x, y) {
    const instance = this.instances.get(id)
    if (!instance) return null
    instance.x = x
    instance.y = y
    this.emit('instance:moved', instance)
    return instance
  }
}
