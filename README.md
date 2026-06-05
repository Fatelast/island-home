# Island Home

Island Home 是一个个人展示型静态网站，用来收集前端项目、摄影作品和生活记录。项目第一版聚焦 MVP，不引入后端、数据库、登录或后台管理系统。

## 项目定位

- 个人主页 / 作品集 / 摄影展示 / 生活记录
- 默认中文主站，预留英文版本
- 内容优先使用静态数据和 Markdown 管理
- 后续可部署到 Cloudflare Pages 或 Vercel

## 技术栈

- [Astro](https://astro.build/)：静态站点生成、路由和页面组织
- [React](https://react.dev/)：局部交互组件
- [TypeScript](https://www.typescriptlang.org/)：类型约束
- [animal-island-ui](https://github.com/guokaigdg/animal-island-ui)：岛屿风格 React UI 组件
- Markdown：生活记录内容

## 国际化方案

项目使用 Astro 内置 i18n 路由能力，并在项目内实现轻量 `t()` 翻译函数。

当前语言配置：

- 默认语言：`zh-CN`
- 预留语言：`en`
- 默认中文路径不加语言前缀，例如 `/`
- 英文路径预留为 `/en/`

短 UI 文案采用“中文原文调用 + 英文语义 key 反查”的方式：

```ts
t(locale, '项目作品')
```

内部会先通过中文原文反查稳定 key，例如 `nav.projects`，再根据当前语言返回对应文案。反查表在模块初始化时构建为 `Map`，每次调用为 O(1) 查询，避免文案数量增长后在渲染时遍历。

当前国际化范围只覆盖站点 UI 和短展示文案。文章标题、文章摘要、文章正文、摄影随笔等内容正文暂不纳入国际化范围，默认按中文展示。

## 页面结构

- `/`：小岛地图首页，展示核心入口和状态信息。
- `/island/projects/`：开发工坊，读取 `src/data/projects.ts`。
- `/island/photos/`：海风相册，读取 `src/data/photos.ts`。
- `/island/notes/`：留言木屋文章列表，读取 `src/content/notes`。
- `/island/notes/[slug]/`：文章详情页，渲染 Markdown 内容。
- `/island/about/`：岛民卡，读取 `src/data/profile.ts`。

## 内容添加方式

项目数据：

```ts
// src/data/projects.ts
{
  title: '项目名称',
  summary: '项目简介',
  status: '正在搭建',
  techStack: ['Astro', 'React'],
  repoUrl: 'https://github.com/...',
  demoUrl: '/',
  coverTone: 'mint',
}
```

摄影数据：

```ts
// src/data/photos.ts
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

文章内容：

```md
---
title: '文章标题'
description: '文章摘要'
pubDate: '2026-06-05'
tags: ['生活', '项目']
locale: 'zh-CN'
---

正文内容...
```

## 图片策略

摄影照片体积通常较大，第一版开始预留图片优化结构：

- 列表页只加载缩略图，未配置缩略图时显示渐变占位块
- 有 `original` 字段时显示大图入口
- 优先使用 `webp` 或 `avif`
- 图片元素使用懒加载和异步解码
- 数据结构保留 `thumbnail` 和 `original` 字段
- 大量图片后续可迁移到 Cloudflare R2、OSS、COS、又拍云或图床

更多约定见 [图片策略](docs/image-strategy.md)。

## SEO

`BaseLayout` 已统一输出基础 SEO 标签：

- `title`
- `description`
- `robots`
- Open Graph
- Twitter Card
- 文章详情页使用 `og:type=article`

如果配置 `SITE_URL`，构建时会输出 canonical URL。

## 部署

推荐第一阶段使用 Cloudflare Pages 或 Vercel 的静态部署能力。

构建命令：

```bash
npm run build
```

输出目录：

```text
dist
```

部署细节见 [部署说明](docs/deployment.md)。

## 本地开发

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build
npm run preview
npm run test
```

## 当前阶段计划

1. 替换真实项目、照片和个人资料。
2. 继续补充 Markdown 文章。
3. 接入真实缩略图和原图素材。
4. 部署到 Cloudflare Pages 或 Vercel。
5. 绑定正式域名后配置 `SITE_URL`。
