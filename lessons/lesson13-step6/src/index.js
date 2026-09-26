export { Designer } from './designer.js'
export {
  BOUNDARY_EPSILON,
  alphaOfColor,
  boundsOfPoints,
  isCoveredBy,
  isSolidFill,
  markBuriedPoints,
  pointInBounds,
  pointInRing,
  splitVisibleRuns,
} from './occlusion.js'
export { nearestAcrossVisibleShapes, nearestVisibleOnShape } from './visible-outline.js'

// 13.1–13.5 那一整套继续从这里出去
export * from '../../lesson13-step5/src/index.js'
