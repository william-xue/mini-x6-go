import { Designer } from '../../lesson7-step5/src/index.js'
import { Assembly } from '../../lesson8-step2/src/index.js'
import { toDefinition } from '../../lesson8-step1/src/index.js'
import { Library, scaleForWidth } from './library.js'

export class Workbench {
  constructor({
    designerContainer,
    assemblyContainer,
    designerWidth,
    designerHeight,
    assemblyWidth,
    assemblyHeight,
  }) {
    this.designer = new Designer({
      container: designerContainer,
      width: designerWidth,
      height: designerHeight,
    })
    this.library = new Library()
    this.assembly = new Assembly({
      container: assemblyContainer,
      width: assemblyWidth,
      height: assemblyHeight,
    })
    this.snapPathData = null
    this.spawned = 0
  }

  setSnapPath(pathData, step = 6) {
    this.snapPathData = pathData
    return this.designer.setSnapPath(pathData, step)
  }

  setSvgBackground(name, svgText) {
    return this.designer.setSvgBackground(name, svgText)
  }

  setTool(tool) {
    this.designer.setTool(tool)
  }

  saveCurrent(name) {
    const definition = toDefinition(this.designer.model, name, { snapPathData: this.snapPathData })
    return this.library.save(definition)
  }

  spawn(definitionId, options = {}) {
    const definition = this.library.get(definitionId)
    if (!definition) return null
    const width = options.width || 300
    const index = this.spawned
    this.spawned += 1
    return this.assembly.addInstance(definition, {
      x: options.x ?? 30 + (index % 2) * 340,
      y: options.y ?? 20 + Math.floor(index / 2) * 200,
      scale: scaleForWidth(definition, width),
    })
  }
}
