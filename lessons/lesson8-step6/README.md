# Lesson 8.6 · 连线按端口方向前置引导

问题：8.4 的边是端点直连的 `<line>`，完全没用端口的 `direction`。连两个同侧端口时，直线会横穿元件本体。

修法：路由前先沿端口方向走出来，再折向对方（第 5.4 课正交路由的同一思路）。

```text
points = [端口, 端口向外 18px, ...中间折点..., 对端向外 18px, 对端]
```

规则：

- `source.direction` 是 left/right → 取中间 X，走 Z 形
- `source.direction` 是 top/bottom → 取中间 Y，走 Z 形
- 任一端点没有 direction（悬空端）→ 退回直线
- 保证每一段要么同 X 要么同 Y

渲染从 `<line>` 换成 `<polyline>`。

## 选中提示改为轮廓高亮

8.2 的选中提示是实例的**外接矩形**。对椭圆、异形元件，矩形外接框必然在四角“飘”在元件外面，看起来像“框盖住元件”。

8.6 改为沿真实轮廓高亮：

```js
polyline.points = definition.snapOutline   // 就是元件外形，现成可用
stroke = '#f07a28'
vector-effect = 'non-scaling-stroke'       // 缩放时线宽不变
```

数据侧的 `[data-instance-box]` 保留（命中区仍用它），但不再作为选中提示显示。

## 已知局限

同侧**同向**端口（如 A 右 → B 右）之间，走线仍会穿过元件本体——两个端口在同一水平线上，直线必然横穿。彻底避免需要障碍物避让，属第 10 课范围。

页面：`http://localhost:4173/lessons/lesson8-step6/demo/`
