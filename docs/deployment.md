# 部署说明

当前项目是 Astro 静态站点，第一阶段推荐部署到 Cloudflare Pages 或 Vercel。

## 通用配置

- 构建命令：`npm run build`
- 输出目录：`dist`
- Node.js：`>=22.12.0`

## 环境变量

上线后建议配置：

```text
SITE_URL=https://your-domain.example
```

配置后，`BaseLayout` 会在构建时输出 canonical URL 和 Open Graph URL。

本地不设置 `SITE_URL`，避免生成 localhost canonical。

## Cloudflare Pages

推荐配置：

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Node.js version: 22.12.0 或更高
```

后续如果摄影图片数量变多，可以优先考虑 Cloudflare R2 存储原图。

## Vercel

推荐配置：

```text
Framework preset: Astro
Build command: npm run build
Output directory: dist
Node.js version: 22.12.0 或更高
```

## 发布前检查

```bash
npm run test
npm run build
```

发布后检查：

- 首页可访问。
- 四个子页面可访问。
- 文章详情页可访问。
- 正式域名下存在 canonical URL。
- 摄影页图片没有横向溢出。
