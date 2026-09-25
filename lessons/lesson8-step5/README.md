# Lesson 8.5 · 定义裁切到元件外形

问题：上一课的 `definition.size` 直接用设计画布尺寸，图形在画布里留白时，实例的包围盒、选中框、命中区都比元件大，看起来像“一个框盖住元件”。

修法：`snapOutline` 的外接矩形就是元件外形框。定义阶段一次性裁切：

```text
body = snapOutline 外接矩形（加 4px 内边距，避免描边被裁）
size        = body 尺寸
snapOutline = 平移 (-body.x, -body.y)
primitives  = 平移 (-body.x, -body.y)
pins        = 重新按 body 归一化
background  = 重写 viewBox 到 body，直接裁切素材
```

裁切后 8.2 的实例数学、8.4 的边端点解析**一行都不用改**——因为它们本来就只依赖 `size`、`x/y`、`u/v`。

## 踩过的坑（重要）

第一次做这个修法时“没修好”，根因不在裁切，而在**示例素材**：

```html
<rect width="420" height="240" fill="#fbfcff"/>   <!-- 整块画布底色，比元件大 -->
```

`viewBox` 只裁剪可见窗口，**不删除内容**。所以即使 viewBox 收窄到裁切框，那块 420×240 的底色矩形仍然铺满整个可见区域，看起来还是一个比元件大的方框。

结论：**素材规范 = 不画整画布底色矩形，viewBox 只包住图形本身。** 删掉它之后，`image` 区域与实例包围盒实测完全重合（差值 0）。

教训：验证要**看渲染结果**，只测几何自证是没用的。

页面：`http://localhost:4173/lessons/lesson8-step5/demo/`
