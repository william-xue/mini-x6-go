# Lesson 8.2 · 定义还原成实例与端口

已完成并冻结。后续步骤不得修改本目录。

在 8.1 的定义之上，把定义真正渲染成可见实例。

```text
definition
  ↓ instantiate(definition, { x, y, scale })
instance = { id, definitionId, x, y, scale, width, height, ports }
  ↓ 渲染
<g transform="translate(x,y) scale(scale)">
  <image 背景 />  <g 图元 />  <circle 端口 />
</g>
```

端口绝对坐标：

```js
x = instance.x + port.u * instance.width
y = instance.y + port.v * instance.height
```

因为 `<g>` 里统一用 `scale(scale)`，所以同一份定义不论多大，端口都按同一比例落位。

页面：`http://localhost:4173/lessons/lesson8-step2/demo/`
