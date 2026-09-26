export { Designer } from './designer.js'
export { DesignerModel } from './model.js'
export { DesignerView } from './view.js'
export { DesignerInteraction } from '../../lesson7-step5/src/interaction.js'

export { mountMaterial, parseMaterial, unmountMaterial } from './material.js'
export {
  GEOMETRY_TAGS,
  SKIP_REASONS,
  SKIP_SUBTREES,
  adaptiveStep,
  applyCtm,
  areaOf,
  boundsOfShapes,
  classifyTag,
  isBackgroundLike,
  invisibilityReason,
  nearestAcrossShapes,
  pickPrimaryShape,
  readShapes,
  sampleCountFor,
  shapeBounds,
} from './outline-source.js'

export { screenToWorld, worldToScreen, zoomAt } from '../../lesson7-step5/src/viewport-math.js'
export { nearestPointOnOutline } from '../../lesson7-step3/src/outline-geometry.js'
export { samplePath } from '../../lesson7-step4/src/path-sampling.js'
