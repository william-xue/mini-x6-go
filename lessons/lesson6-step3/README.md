# Lesson 6.3 · 多选拖动三刀

已完成并冻结。第 6 章全部完成。

```text
第一刀：pointerdown 拍所有选中节点的位置快照
第二刀：pointermove 只移动 previewLayer，不改 Model
第三刀：pointerup 删除预览，把 delta 一次写回真实节点
```

页面：`http://localhost:4173/lessons/lesson6-step3/demo/`
