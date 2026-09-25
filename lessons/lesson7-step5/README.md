# Lesson 7.5 · 视口坐标系

已完成并冻结。第 7 章完成。

在冻结的 7.4 上增加：

- `viewport = { x, y, zoom }`，只影响显示，不影响数据
- 所有内容装进一个 `<g data-viewport>`，只改这一个 transform
- 鼠标输入经逆变换 `world = (screen − viewport.xy) ÷ zoom` 进入世界坐标
- 滚轮以光标为锚点缩放，平移工具拖动平移
- 缩放范围 0.25 ~ 4

```text
世界坐标（真值）      viewport（相机）
snapOutline 的坐标     x, y, zoom
引脚 x/y                                               
        ↓ 同一个变换
      屏幕显示
```

页面：`http://localhost:4173/lessons/lesson7-step5/demo/`
