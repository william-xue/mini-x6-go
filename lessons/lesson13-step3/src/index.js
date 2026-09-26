export { Designer } from './designer.js'
export { DesignerModel } from './model.js'
export { DesignerView } from './view.js'
export { Assembly } from './assembly.js'
export { ConnectingInteraction } from './assembly-interaction.js'

export { toDefinition } from './definition.js'
export { PIN_KIND_COLORS, PIN_KIND_LABELS, PIN_KINDS, kindLabel } from './pin-style.js'
export { kindsCompatible, validateConnection } from './pin-kind.js'
export {
  angleOf,
  cardinal4,
  nearestOnShape,
  nearestPointOnAnyShape,
  outwardNormal,
  pointsFormClosedLoop,
  signedAreaTwice,
} from './outline-normal.js'

// 13.1 / 13.2 那一整套继续从这里出去
export * from '../../lesson13-step2/src/index.js'
