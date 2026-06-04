# 项目上下文：Island Home 个人主页

## 基础信息

项目仓库：`git@github.com:Fatelast/island-home.git`  
本地路径：`D:\island-home`  
项目类型：个人主页 / 作品集 / 摄影展示 / 生活记录网站  
开发者背景：前端开发，对后端、数据库、服务器运维不熟悉  
当前策略：第一版做静态 MVP，不引入后端、数据库、后台管理系统

## 核心目标

我要搭建一个个人展示型网站，不是传统博客系统。

网站主要展示三类内容：

1. 前端开发项目
   - 项目截图
   - GitHub 仓库地址
   - 线上预览链接
   - 项目简介
   - 技术栈

2. 摄影作品
   - 展示相机拍摄的照片
   - 照片体积通常较大
   - 需要提前考虑缩略图、懒加载、大图预览、CDN/图床预留

3. 生活记录
   - 发布个人文章
   - 发布日常照片
   - 发布文字记录

项目素材、照片素材、文章内容第一阶段可以先做占位和预留数据结构。

## 技术决策

推荐并已初始化的技术栈：

- Astro
- React
- TypeScript
- animal-island-ui
- Markdown/MDX
- 静态数据 JSON/TS 配置
- 后续部署到 Cloudflare Pages 或 Vercel

选择原因：

- `animal-island-ui` 是 React Web UI 组件库，用 React 方案更合适。
- 网站主要是展示型内容，Astro 更适合静态生成、SEO 和首屏性能。
- Astro 可以局部使用 React 组件，因此可以兼顾静态站点性能和 React 组件复用。
- 第一版不需要后端、数据库或服务器运维。

## 视觉方向

网站整体视觉风格需要与 `guokaigdg/animal-island-ui` 保持一致。

风格关键词：

- 轻松
- 柔和
- 可爱
- 岛屿感
- 个人小岛
- 圆角卡片
- 明亮背景
- 柔和阴影
- 适度插画感 / 贴纸感

不要做成：

- 商务 SaaS 风格
- 黑白极简摄影站
- 传统博客模板风格
- 过重的后台管理系统风格

## MVP 页面

第一版最小可行版本包含：

1. 首页
   - 头像
   - 姓名 / 昵称
   - 前端开发者身份
   - 摄影爱好
   - 一句话介绍
   - 精选项目入口
   - 精选照片入口
   - 最近生活记录入口

2. 项目页
   - 项目卡片网格
   - 项目截图
   - 项目简介
   - 技术栈标签
   - GitHub 地址
   - 线上链接

3. 摄影页
   - 照片网格 / 瀑布流
   - 缩略图优先加载
   - 点击查看大图
   - 预留照片元信息：地点、时间、相机、镜头

4. 生活记录页
   - 文章 / 图文记录列表
   - 支持 Markdown/MDX
   - 预留封面图、标签、日期

5. 关于页
   - 个人介绍
   - 技能栈
   - 摄影设备
   - 联系方式
   - 社交链接

## 数据设计建议

项目数据：

```ts
{
  title: '项目名称',
  description: '项目简介',
  cover: '/images/projects/demo.webp',
  techStack: ['React', 'TypeScript', 'Astro'],
  repoUrl: 'https://github.com/...',
  demoUrl: 'https://...',
}
```

摄影数据：

```ts
{
  title: '照片标题',
  location: '拍摄地点',
  date: '2026-06-04',
  camera: '相机型号',
  lens: '镜头信息',
  thumbnail: '/images/photos/thumb.webp',
  original: '/images/photos/original.webp',
}
```

生活记录使用 MDX frontmatter：

```mdx
---
title: '记录标题'
date: '2026-06-04'
tags: ['生活', '摄影']
cover: '/images/posts/demo.webp'
---

正文内容...
```

## 图片加载策略

摄影照片体积较大，需要从第一版就预留图片优化策略：

- 列表页只加载缩略图
- 原图点击后再加载
- 使用 `webp` 或 `avif`
- 使用懒加载
- 首屏只展示少量精选照片
- 大量照片后续放 Cloudflare R2、OSS、COS、又拍云或图床
- 数据结构中保留 `thumbnail` 和 `original` 字段，方便后续切 CDN

## 当前本地项目状态

本地项目已创建在：

```text
D:\island-home
```

已完成：

- 初始化 Astro + React + TypeScript 项目
- 安装 `animal-island-ui`
- 初始化 Git
- 设置主分支为 `main`
- 远程 `origin` 链接到 `git@github.com:Fatelast/island-home.git`
- 本地构建 `npm run build` 已通过
- 用户已执行初始提交和 push

## 后续开发要求

请在新会话中遵循以下工作方式：

- 所有回复使用中文
- `Implementation Plan`、`Task List`、`Decision Notes` 使用中文
- 开发前必须先阅读项目结构、配置、已有实现
- 遵循“构思方案 → 提请审核 → 分解为具体任务”的流程
- 优先复用项目已有组件、工具函数、hooks、样式约定
- 遵循 KISS 原则，不做不必要的后端、数据库、登录、后台系统
- 前端代码遵循 Airbnb JavaScript Style Guide、ESLint、TypeScript/React 最佳实践
- 展示中文文本如进入代码，应根据项目语法使用国际化方法包裹；若项目尚未建立 i18n，需要先提方案确认
- 代码注释只在复杂业务逻辑、公共工具函数、跨模块复用函数中使用 JSDoc
- 删除项目文件前必须先确认

## 下一步建议

新会话开始后，请先执行：

1. 读取 `D:\island-home` 项目结构
2. 检查 `package.json`、`astro.config.mjs`、`src/pages/index.astro`
3. 确认 `animal-island-ui` 的样式接入方式
4. 提出首页 + 基础布局 + 数据结构的第一阶段实施方案
5. 等我确认后再开始编码
