# 海风相册知识快照

## 模块定位

海风相册是静态生成、客户端渐进增强的照片浏览模块。Astro 负责首屏 HTML、时间归档、分页和 JSON 数据；React 只增强瀑布流测量、加载更多和灯箱。

## 路由

HTML 路由：

```text
/island/photos/
/island/photos/page/2/
/island/photos/2026/
/island/photos/2026/page/2/
/island/photos/2026/05/
/island/photos/2026/05/page/2/
```

对应的加载数据：

```text
/island/photos/data/all.json
/island/photos/data/page/2.json
/island/photos/data/2026.json
/island/photos/data/2026/page/2.json
/island/photos/data/2026/05.json
/island/photos/data/2026/05/page/2.json
```

路由由 `src/lib/photos.ts` 在构建阶段统一生成，避免 HTML 和 JSON 分页规则分叉。

## 数据约束

照片在 `src/data/photos.ts` 中维护：

```ts
interface PhotoItem {
  id: string;
  title: string;
  alt: string;
  location: string;
  date: string;
  camera: string;
  lens: string;
  width: number;
  height: number;
  thumbnail?: string;
  thumbnailSources?: PhotoSource[];
  original?: string;
  color: 'teal' | 'gold' | 'pink' | 'green';
}
```

注意事项：

- `id` 必须全局唯一且长期稳定。
- `date` 使用 `YYYY-MM-DD`。
- `width` 和 `height` 填写真实原片或同画幅缩略图尺寸。
- `thumbnail` 用于信息流，`original` 只在灯箱打开后加载。
- `thumbnailSources` 可配置 WebP/AVIF 响应式图片。
- 宽高比达到 `2.4` 时视为全景照片。

## 组件职责

- `PhotoArchivePage.astro`：组合页面标题、归档筛选和客户端相册。
- `PhotoArchiveFilter.astro`：输出真实年份、月份链接。
- `PhotoGallery.tsx`：维护批次、加载更多、历史 URL 和灯箱状态。
- `PhotoCard.tsx`：保留画幅、缩略图状态和渐进元信息。
- `PhotoLightbox.tsx`：原图加载、相邻切换、键盘、焦点和背景滚动锁定。
- `src/lib/photos.ts`：排序、归档、分页、URL、去重和索引纯函数。

## 渐进增强边界

- 首批照片由 React 服务端渲染，客户端脚本失败时仍能浏览。
- 无 JavaScript 时，“加载更多”是普通下一页链接。
- hydration 后使用 CSS Grid 行跨度消除不同画幅产生的空隙。
- 加载更多只请求下一页静态 JSON，不解析 HTML。
- 全局 `pageMotion.ts` 不管理相册内部动效。

## 新增照片步骤

1. 生成信息流缩略图，建议 WebP 或 AVIF。
2. 准备灯箱大图，不要在列表中直接引用原图。
3. 在 `src/data/photos.ts` 增加完整 `PhotoItem`。
4. 确认 `id` 唯一，`width`、`height` 与实际画幅一致。
5. 运行 `npm run test`。
6. 运行 `npm run build`，确认新增年份、月份和分页路由。

## 国际化范围

归档按钮、加载状态、灯箱按钮等 UI 文案必须使用 `t(locale, '中文原文')` 对应的语义 key。

照片标题、地点、相机和镜头属于个人摄影内容，不强制提供英文翻译。未配置翻译时保留中文原文。

## 已知扩展方向

- 自动读取 EXIF。
- CDN 图片转换和多尺寸生成。
- 地点、设备和标签筛选。
- 数千张照片规模下的独立索引或虚拟化。
