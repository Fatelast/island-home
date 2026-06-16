# 项目知识快照

## 当前架构

Island Home 是 Astro 静态站点，内容由 Sanity 托管：

- Sanity Studio 负责相册、文章、项目和个人资料的编辑与发布。
- Astro 在构建阶段读取 `production` 数据集中的已发布内容。
- Cloudflare Pages 托管 `dist` 静态产物。
- Sanity Webhook 调用 Cloudflare Deploy Hook，内容发布后自动重建。

前台不使用 Sanity Token，`useCdn: false` 用于构建时读取最新发布数据。

## 内容访问层

所有页面通过 `src/lib/content/` 访问 Sanity：

- `client.ts`：公开只读客户端。
- `queries.ts`：GROQ 查询。
- `mappers.ts`：Sanity 文档到稳定前台类型的映射。
- `photos.ts`、`notes.ts`、`projects.ts`、`profile.ts`：按内容类型提供读取函数。
- `image.ts`：生成 Sanity CDN 图片 URL。
- `types.ts`：页面和组件使用的内容类型。

页面不应直接调用 `sanityClient.fetch`，也不应重新引入本地静态数据。

## 当前页面

- `/`：首页，小岛地图入口。
- `/island/projects/`：开发工坊，读取 Sanity 项目。
- `/island/photos/`：海风相册及年月归档，读取 Sanity 相册。
- `/island/notes/`：文章列表，读取 Sanity 文章。
- `/island/notes/[slug]/`：Portable Text 文章详情。
- `/island/about/`：读取固定 ID 为 `profile` 的单例资料。

## 内容模型

- `photo`：标题、替代文本、拍摄信息、图片、占位色和排序。
- `note`：标题、slug、摘要、发布日期、标签和 Portable Text 正文。
- `project`：简介、状态、技术栈、链接、封面和排序。
- `profile`：固定 `_id=profile` 的单例文档。

## 迁移与回滚

`scripts/migrate-to-sanity.ts` 使用稳定 `_id` 和 `createOrReplace`，可重复执行。Markdown 通过 MDAST 转为 Portable Text，不使用正则拆分正文。

旧内容仍保留在：

- `src/data/photos.ts`
- `src/data/projects.ts`
- `src/data/profile.ts`
- `src/content/notes/*.md`
- `src/content.config.ts`

完成线上新增、修改、删除和 Webhook 验证前，不删除这些文件。

## 动画边界

- `src/scripts/pageMotion.ts` 负责页面标题、内容卡片和页面操作按钮动效。
- 顶部导航是跨页面稳定操作区域，不参与页面进入动画。
- 导航 hover、active、focus 仅由 `SiteHeader.astro` 的 CSS 管理，避免 GSAP 与 CSS 同时写入 `transform`。
- 新增全局动效目标时，不要将 `.site-header` 或 `.site-header__link` 加入页面进入及通用 hover 动画。

## 国际化边界

UI 文案继续使用 `t(locale, '中文原文')`。Sanity 中维护的标题、摘要、标签、资料和正文属于内容数据，直接显示，不传给 `t()`。

## 部署

- Studio：`https://island-home.sanity.studio/`
- Sanity 项目 ID：`ypkwhakf`
- 数据集：`production`
- Cloudflare 构建：`npm run test && npm run build`
- Cloudflare 输出目录：`dist`

具体环境变量、Deploy Hook 和 Webhook 配置见 `docs/deployment.md`。
