# 图片策略

相册和文章图片统一上传到 Sanity，不进入 Git 仓库，也不进入 Cloudflare Pages 构建产物。

## 数据流

1. 在 Sanity Studio 上传图片并维护 `alt` 文本。
2. Astro 构建时读取图片 asset 引用。
3. `@sanity/image-url` 生成 Sanity CDN 地址和目标宽度。
4. 浏览器直接从 Sanity CDN 加载图片。

相册缩略图最大宽度为 1200，查看大图最大宽度为 2400；文章正文图片默认最大宽度为 1600，并启用自动格式转换。

## 当前规则

- 新相册发布前应上传图片并填写替代文本。
- 首次迁移的四条占位相册允许暂时没有图片。
- 没有图片时继续使用现有渐变占位块。
- 图片使用 `loading="lazy"` 和 `decoding="async"`。
- 图片标题、说明和文章正文属于内容，不纳入 UI 国际化。
- 不把 Sanity CDN 图片下载或复制到 `public/`。

## 成本与维护

当前方案使用 Sanity 免费额度和 CDN，仓库只保存代码与旧数据备份。内容维护在 Studio 完成，发布后由 Webhook 触发 Cloudflare Pages 重新构建。

旧的 `src/data/photos.ts` 暂时保留，仅用于迁移回滚；线上验证完成前不删除。
