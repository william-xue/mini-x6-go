# Lesson 8.3 · 元件库与多实例

已完成并冻结。后续步骤不得修改本目录。

闭环：**设计器 → 定义 → 库 → 实例**。

- `Library` 按 id 保存定义；同 id 再保存是**更新**，不是新增
- 点库里的定义 → `Workbench.spawn()` 实例化到装配画布
- `scaleForWidth(definition, width)` 让同一份定义以统一的目标宽度渲染
- 装配渲染直接复用 8.2 的 `Assembly`，不重复实现图元绘制

```text
设计器（7.x）
  ↓ toDefinition（8.1）
definition
  ↓ library.save（8.3）
元件库
  ↓ workbench.spawn → assembly.addInstance（8.2）
实例（可多个、可拖动）
```

页面：`http://localhost:4173/lessons/lesson8-step3/demo/`
