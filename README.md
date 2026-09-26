# mini-x6-go

从零实现一个最小图编辑器。一次只完成并学会一课。

## 学习闸门

```text
完成一课 → 学会并验收一课 → 才能开始下一课
```

每课保留独立、可运行的代码快照。已通过的课冻结，不再被后续实现覆盖。

## 当前进度

| 课 | 内容 | 状态 |
|---|---|---|
| 1 | 图模型 + SVG 局部渲染 | 已完成并内化 |
| 2 | 端口 | 已完成并内化 |
| 3 | 点选、拖动、级联删除 | 已完成并内化 |
| 4 | 从端口拉线、吸附、悬空端 | 已完成并内化 |
| 5 | 边命中、端点重连、折点、正交路由 | 已完成并内化 |
| 6 | 框选、多选、三刀拖动 | 已完成并内化 |
| 7 | 设计器：图元、背景、曲线吸附、视口 | 已完成并内化 |
| 8 | 引脚放置 + 定义/库 + 实例化 + 装配连线 + 裁切 + 走线 | 已实现，待用户验收 |
| 9 | 撤销/重做 + 两态 JSON 持久化 | 进行中（9.1/3） |
| 10 | 简单避障 + 大图性能验证 | 未开始 |
| 11 | 3D 点云视图与 3D 框（换渲染后端 deck.gl） | 仅规划，未实现 |
| 12 | 2D↔3D 融合：相机投影与多视角同步 | 仅规划，未实现 |
| 13 | 引脚编辑：轮廓读素材 + 编辑闭环 + 引脚语义 + 读不了的也能点 + 坐标换算 + 遮挡判定（13.7 回填 X6 插件） | 13.6/7 |

> 恢复现场看 `HANDOFF.md`。

## 课程目录

```text
lessons/
  lesson1/         图模型 + SVG 局部渲染
  lesson2/         端口
  lesson3/         点选、拖动、级联删除
  lesson4/         从端口拉线、吸附、悬空端
  lesson5-step1/   边命中、选中、删除
  lesson5-step2/   边端点手柄与重连
  lesson5-step3/   折点数据与拖动手柄
  lesson5-step4/   自动正交路由
  lesson6-step1/   空白拖动框选
  lesson6-step2/   追加多选与统一选区盒
  lesson6-step3/   多选拖动三刀
  lesson7-step1/   基础图元设计器
  lesson7-step2/   SVG 整体背景
  lesson7-step3/   不规则轮廓引脚吸附
  lesson7-step4/   贝塞尔曲线轮廓吸附
  lesson7-step5/   视口坐标系
  lesson8-step1/   设计态生成元件定义
  lesson8-step2/   定义还原成实例与端口
  lesson8-step3/   元件库与多实例
  lesson8-step4/   装配画布端口连线
  lesson8-step5/   定义裁切到元件外形
  lesson8-step6/   连线按端口方向前置引导
  lesson9-step1/   命令栈与「一次操作」
  lesson13-step1/  轮廓从素材里读出来
  lesson13-step2/  引脚的加、删、拖
  lesson13-step3/  引脚的名称、类型与连接规则
  lesson13-step4/  让「读不了的」也能被点
  lesson13-step5/  坐标换算：有没有 getCTM，差多少
  lesson13-step6/  看不见的边不能点（遮挡判定）
```

## 运行

```bash
npm test
npm run dev
```

打开 `http://localhost:4173/` 选择课程。

必须用 `npm run dev`（自带 Node 静态服务器）。不要用 `python3 -m http.server`：并发加载多个 ES Module 时会偶发 `ERR_CONNECTION_RESET`，导致页面整块空白。

## 阅读顺序

每课先读 `docs/NN-*-方案.md`，再读该课 `src/`，最后看 `tests/`。
