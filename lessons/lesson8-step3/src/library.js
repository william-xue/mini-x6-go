export function scaleForWidth(definition, width) {
  return width / definition.size.width
}

export class Library {
  constructor() {
    this.definitions = new Map()
  }

  save(definition) {
    this.definitions.set(definition.id, definition)
    return definition
  }

  get(id) {
    return this.definitions.get(id) || null
  }

  list() {
    return [...this.definitions.values()]
  }
}
