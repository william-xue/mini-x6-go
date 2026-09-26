// 13.3：引脚有了身份之后，"哪两个能连"才有意义。
// 规则写在纯函数里，界面只负责把拒绝的理由显示出来。

export const PIN_KINDS = ['input', 'output', 'bidirectional']

export const PIN_KIND_LABELS = {
  input: '输入',
  output: '输出',
  bidirectional: '双向',
}

export function kindLabel(kind) {
  return PIN_KIND_LABELS[kind] || '未指定'
}

/**
 * 两个类型能不能接上：
 *   双向 = 通配
 *   输入↔输出 = 可以
 *   输入↔输入、输出↔输出 = 不行（这是最常见的一类接错）
 */
export function kindsCompatible(a, b) {
  if (a === 'bidirectional' || b === 'bidirectional') return true
  return a !== b
}

function sameTerminal(a, b) {
  return a && b && a.instanceId === b.instanceId && a.portId === b.portId
}

function samePair(left, right) {
  const forward = sameTerminal(left.source, right.source) && sameTerminal(left.target, right.target)
  const backward = sameTerminal(left.source, right.target) && sameTerminal(left.target, right.source)
  return forward || backward
}

/**
 * 校验一条待建立的连接。
 *
 * @param source    { instanceId, portId }
 * @param target    { instanceId, portId }
 * @param edges     已有的边
 * @param lookup    (terminal) => { name, kind } | null   —— 由调用方去定义里查
 * @returns { ok, reason }
 */
export function validateConnection({ source, target, edges = [], lookup }) {
  if (!source || !target) return { ok: false, reason: '端点不完整' }

  if (sameTerminal(source, target)) {
    return { ok: false, reason: '同一个引脚不能连自己' }
  }

  const pending = { source, target }
  if (edges.some((edge) => samePair(edge, pending))) {
    return { ok: false, reason: '这两个引脚之间已经有一条线了' }
  }

  const a = lookup ? lookup(source) : null
  const b = lookup ? lookup(target) : null
  if (!a || !b) {
    return { ok: false, reason: '引脚在定义里找不到了（元件定义可能被改过）' }
  }

  if (!kindsCompatible(a.kind, b.kind)) {
    return {
      ok: false,
      reason: `类型冲突：${a.name}（${kindLabel(a.kind)}）不能接 ${b.name}（${kindLabel(b.kind)}）`,
    }
  }

  return { ok: true, reason: `${a.name}（${kindLabel(a.kind)}）→ ${b.name}（${kindLabel(b.kind)}）` }
}
