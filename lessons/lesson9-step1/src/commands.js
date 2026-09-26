// 命令是纯数据，可以被 JSON 序列化。
// 「怎么执行」不在命令里，而在这两个解释器函数里。
export function applyCommand(model, command) {
  if (command.type === 'instance:move') {
    return model.moveInstance(command.id, command.to.x, command.to.y)
  }
  throw new Error(`未知命令类型：${command.type}`)
}

export function revertCommand(model, command) {
  if (command.type === 'instance:move') {
    return model.moveInstance(command.id, command.from.x, command.from.y)
  }
  throw new Error(`未知命令类型：${command.type}`)
}
