# 项目知识快照

## 当前定位

Island Home 是个人展示型静态网站，第一阶段保持静态 MVP，不引入后端、数据库、登录和后台管理。

## 当前页面

- `/`：首页，小岛地图入口。
- `/island/projects/`：开发工坊，读取 `src/data/projects.ts`。
- `/island/photos/`：海风相册，读取 `src/data/photos.ts`。
- `/island/notes/`：留言木屋，读取 Astro Content Collection `notes`。
- `/island/notes/[slug]/`：文章详情页。
- `/island/about/`：岛民卡，读取 `src/data/profile.ts`。

## 公共组件

- `src/layouts/BaseLayout.astro`：全局 HTML、导航、Cursor 包裹、基础 SEO。
- `src/components/site/SiteHeader.astro`：顶部导航。
- `src/components/island/PageShell.astro`：子页面统一标题区。
- `src/components/island/ProjectCard.astro`：项目卡片。
- `src/components/island/PhotoCard.astro`：摄影卡片。
- `src/components/island/NoteCard.astro`：文章卡片。
- `src/components/island/TagList.astro`：标签列表。

## 国际化边界

当前国际化只覆盖 UI 文案和短展示文案。

不纳入国际化范围：

- Markdown 文章正文。
- 文章标题和摘要。
- 摄影随笔正文。

UI 文案继续使用 `t(locale, '中文原文')`，中文原文通过 `sourceTextKeys` 反查英文语义 key。

## 内容管理

- 项目：静态 TS 数据。
- 摄影：静态 TS 数据，预留 `thumbnail` 和 `original`。
- 文章：`src/content/notes` 下的 Markdown 文件。

## 图片策略

- 列表页优先缩略图。
- 原图通过 `original` 延后访问。
- 未配置真实图片时使用渐变占位块。
- 后续可迁移到 Cloudflare R2、OSS、COS 或图床。

## 部署策略

推荐优先 Cloudflare Pages 或 Vercel。

- 构建命令：`npm run build`
- 输出目录：`dist`
- 站点 URL：通过 `SITE_URL` 环境变量配置
