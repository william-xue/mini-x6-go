# Lesson 8.4 · 装配画布端口连线

已完成并冻结。后续步骤不得修改本目录。

补上第 8 章缺失的最后一环：装配画布的**边**。

```text
edge = {
  source: { instanceId, portId } | { x, y },
  target: { instanceId, portId } | { x, y },
}
```

- 边只保存端口引用，不保存坐标（第 1 课的结论在这里复用）
- 端口绝对坐标由 `instance.x/y/width/height` + 端口 `u/v` 现场解析
- 拉线：端口命中优先于实例拖动；拖动显示虚线；松手吸附最近端口，空白则成悬空边
- 移动实例时，相连边自动重新解析端点

复用关系：

```text
AssemblyModel     extends 8.2 的模型，只加 edges / 端口命中 / 端点解析
AssemblyView      extends 8.2 的视图，只加边图层与虚线
AssemblyInteraction extends 8.2 的交互，只加“端口优先”的拉线分支
```

页面：`http://localhost:4173/lessons/lesson8-step4/demo/`
