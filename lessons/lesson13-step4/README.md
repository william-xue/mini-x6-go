# Lesson 13.4 · 让「读不了的」也能被点

## 要解决的问题

13.1–13.3 对四类东西一律说"读不了"，因为浏览器不提供它们的几何：

```text
<image> 位图        一堆像素，没有"周长"这个概念
<image> 内嵌 SVG    外面套了一层 <image>，里面其实是矢量图形
<text>              文字
<use>               只是"去别处取一个图形来用"的引用
```

客户的原话是「图片、隐藏件这种东西也要能点」。但"能点"要先拆成两件事：

```text
意思 A  看不见也要能吸附    ← 引脚吸到隐藏的辅助几何（比如不可见的安装背板）
意思 B  先让它显示出来再点   ← 这其实是图层可见性开关，跟吸附无关
```

这一课做的是 A，外加把上面四类"读不了的"尽量变成"读得了的"。

## 心智模型

**先分清"谁没有几何"，再决定用哪条路。**

```text
                        有几何 API 吗？
                        ├── 有 → 走 13.1 那条路（真外形）
                        └── 没有
                             ├── 是内嵌 SVG 吗？ → 解开，读里面的真图形（真外形）
                             ├── 是指向别处吗？   → 找到目标读它（真外形）
                             └── 都不是（位图 / 文字）→ 退成外接矩形（矩形近似，并如实标注）
```

而且"退成外接矩形"这件事本身也别小看：矩形是**首尾重合的闭合轮廓**，
所以它的外法线由绕向推出，四条边朝外 —— 引脚至少能落在合理的位置上，只是贴不出真实形状。

## 三个实测出来的硬事实

**一、被祖先藏起来的图形，几何是完好的**

```text
被 display:none 的组包住的图形   长度 200 ✓   getCTM a=1 e=5 f=5 ✓   完整
被 visibility:hidden 包住的      长度 200 ✓   getCTM 完整 ✓
被 opacity:0 包住的              长度 200 ✓   getCTM 完整 ✓
元素自己被 display:none          长度 200 ✓   getCTM 退化成 e=0 f=0  自身 transform 被丢掉
```

所以"让隐藏件也能被点"几乎是免费的：**长度和坐标本来就都在，只要不清掉它们**。

但最后一行是死路：元素自己被藏时，`getCTM` 会丢掉它自己的 transform，
落点坐标会**静默偏移** —— 这种只能如实报"读不了"，不能假装能读。
判据就是"隐藏写在祖先上，还是写在自己身上"。

实测（开开关之后）：

```text
circle-6  <circle>  来源=素材里的几何图形（真外形）  [隐藏件·真外形]  长度 301.11
```

**二、`<image>` 的 href 里那段 SVG 文本拿得到**

```text
data:image/svg+xml;charset=utf-8,<urlencoded>   → decodeURIComponent
data:image/svg+xml;base64,<base64>              → atob
https://example.com/a.svg                       → 要异步取，本课不解（如实跳过）
```

**三、`<use>` 能穿透，但要自己补 use 的位置**

```text
<use> 本身          没有 getTotalLength / getPointAtLength（读不出"多长"）
被引用的图形         长度 ✓（两者都有 getCTM，但**都不含** use 的 x/y）
```

注意一处容易搞混的地方（我第一版就写错过）：`<use>` **有** `getCTM`（它和 `<image>`、`<text>`、`<g>`
一样都是 SVG 图形元素，`getCTM` 是 SVG 图形元素通用的），`getCTM` 给的是它自己那层的变换；
真正缺的是"长度类"的 API。所以读不了 `<use>` 不是因为拿不到矩阵，而是因为它身上没有几何。

（后来实测更正：早先写过"`<use>` / `<image>` 的 getCTM 返回 null" —— 那是错的，
是探针里走了 `typeof getTotalLength === 'function'` 的分支、根本没调 `getCTM`。
实测它们都有 `getCTM`。这个错误认知没有污染代码：判定"能不能读"用的是长度类 API，不是 CTM。）

所以：找到被引用的元素，把它的内容复制一份，套上
`translate(素材→画布) translate(use.x, use.y) translate(symbol 换算) scale(...)`。
如果目标是带 `viewBox` 的 `<symbol>` 且 use 有 width/height，还要按 meet 规则再缩一次。

## 唯一一处"手写换算"，以及为什么它必须可测

13.1 里"素材坐标 → 画布坐标"是**让浏览器算的**（`getCTM`），一行数学都没写。
到了第二层嵌套（`<image>` 里面还是 `<svg>`），浏览器帮不上了，只能自己算：

```text
meetTransform(viewBox, boxWidth, boxHeight)
  scale   = min(boxWidth / vb.width, boxHeight / vb.height)
  offsetX = (boxWidth - vb.width * scale) / 2 - vb.x * scale
```

所以它被抽成纯函数，并且**拿 13.1 的实测值当基准**：

```text
13.1 里浏览器给的 getCTM： a = 4.200   e = 14.000   f = 0.000
本课手算 meetTransform(‘0 0 200 100’, 868, 420)： scale = 4.2   offset = (14, 0)
```

两套算法必须给出同一组数，否则解析出来的图形会和屏幕上看到的错位。
单测直接断言这一点。

## 实测：位置精确吻合

素材里那张内嵌 SVG 的图片放在 `x=40 y=30 w=320 h=200`，内嵌 viewBox 是 `0 0 120 80`：

```text
手算：scale = min(320/120, 200/80) = 2.5   水平居中偏移 = 10
      矩形 (5,5,48,70) → 画布 (50+12.5, 30+12.5) 尺寸 (120, 175) = x 62.5~182.5  y 42.5~217.5
实测：rect-7  x:63~183  y:43~218        ✓
      圆 (92,40) r24 → 画布圆心 (280,130) 半径 60 = x 220~340 y 70~190
实测：circle-8 x:220~340  y:70~190      ✓
```

`<use>` 也一样：symbol 40×40 放进 use 的 140×140 → scale 3.5，
三角形 (0,0)(40,0)(20,40) → 画布 x 580~720 y 130~270。实测 `polygon-9 x:580~719 y:130~267` ✓

## 接口

```js
new Designer({ container, width, height, outline: {
  includeHidden: false,   // 被祖先藏起来的辅助几何要不要收进落点候选（默认关）
}})

designer.setIncludeHidden(true)   // 改开关并重读
designer.getIncludeHidden()
designer.describeSources(report)  // 形状来源统计，给诊断面板用
```

报告里每条轮廓多了三个字段：

```js
{
  source: 'geometry' | 'image-svg' | 'image-bbox' | 'text-bbox' | 'use-target' | 'use-bbox',
  approximate: true,   // 是不是"外接矩形近似"
  hidden: true,        // 是不是收编进来的隐藏件
}
```

## 与 13.3 的关系

```text
13.1 读轮廓 → 13.2 编辑闭环 → 13.3 身份与校验   ← 全部原样继承
13.4 只覆盖 13.1 留的那个接缝 collectShapes()：
     默认行为不变（includeHidden 默认关，几何图形那条路完全没动）
```

## 已知局限

1. **外链的 SVG 图片不解**（`https://…/a.svg`）：要异步取，会打乱"同步读轮廓"的时序。如实列为跳过。
2. **位图只退成外接矩形**，不做像素边缘检测 —— 那要画进 canvas 扫 alpha、边界追踪、抽稀，
   而且跨域图片会污染 canvas。见方案文档 13.4 的"三档成本"。
3. **`<text>` 也是外接矩形**，不沿字形轮廓（那要 `getExtentOfChar` 逐字取，收益很低）。
4. **不能画进图里的东西仍然读不了**：`<clipPath>` / `<mask>` / `<pattern>` 里的图形只是模板，
   它们参与的是"裁剪/遮罩"，不是可落点的实体。
5. 仍然没有撤销（依赖第 9 课 9.2）。

## 验收

- [ ] 默认状态下，素材里那条 `display:none` 的圆**不在**候选里（诊断里列为"看不见"）
- [ ] 点「收编隐藏件」，该圆被收进来，诊断里标成 `[隐藏件·真外形]`，位置与素材里画的一致
- [ ] 内嵌 SVG 的那张图片：解出的是**它里面的圆角矩形和圆**，不是一个 320×200 的框
- [ ] 位图那张：退成外接矩形，诊断里标成 `[矩形近似]`
- [ ] 文字：退成外接矩形，标成 `[矩形近似]`
- [ ] `use` 引用的三角形：解出真外形，长度 ≈ 129.44（= 3.5 × 原来的 37）
- [ ] 在解出来的圆上点一下，引脚落在这个圆上（而不是落在那张图片的矩形框上）
- [ ] 关掉开关再打开，候选数量在 6 / 7 之间切换，不多不少

页面：`http://localhost:4173/lessons/lesson13-step4/demo/`
