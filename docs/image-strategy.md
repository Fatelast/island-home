# 图片策略

当前项目第一阶段不直接接入图床或 CDN，但数据结构已经为真实图片预留字段。

## 摄影数据字段

摄影条目位于 `src/data/photos.ts`。

```ts
{
  title: '照片标题',
  alt: '照片替代文本',
  location: '拍摄地点',
  date: '2026-06-05',
  camera: '相机型号',
  lens: '镜头信息',
  thumbnail: '/images/photos/demo-thumb.webp',
  original: '/images/photos/demo-original.webp',
  color: 'teal',
}
```

## 当前规则

- `thumbnail` 有值时，列表页渲染真实缩略图。
- `thumbnail` 为空时，使用渐变占位块。
- `original` 有值时，显示“查看大图”入口。
- `original` 为空时，显示“大图待补充”。
- 缩略图使用 `loading="lazy"` 和 `decoding="async"`。
- 图片正文、摄影文章正文暂不纳入 UI 国际化范围。

## 推荐目录

```text
public/images/photos/
  demo-thumb.webp
  demo-original.webp
```

## 后续扩展

- 缩略图优先使用 `webp` 或 `avif`。
- 原图不要直接进入首屏列表。
- 大量照片后再迁移到 Cloudflare R2、OSS、COS 或图床。
- 保持 `thumbnail` 和 `original` 字段不变，方便后续切换 CDN URL。
