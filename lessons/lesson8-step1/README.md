# Lesson 8.1 · 设计态生成元件定义

已完成并冻结。后续步骤不得修改本目录。

在冻结的第 7 章设计器之上，把当前设计状态编译成一份**与分辨率无关**的元件定义。

```js
definition = {
  id, name,
  size: { width, height },
  background,
  snapPathData,
  snapOutline,
  primitives,                       // 定义局部坐标
  pins: [{ id, u, v, direction }],  // 归一化 0~1
}
```

关键点：定义里**不保存引脚的绝对坐标**。`u/v` 让同一份定义可以在任意尺寸的实例上还原端口位置。

页面：`http://localhost:4173/lessons/lesson8-step1/demo/`
