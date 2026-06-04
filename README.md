# Island Home

Island Home 是一个个人展示型静态网站，用来收集前端项目、摄影作品和生活记录。项目第一版聚焦 MVP，不引入后端、数据库、登录或后台管理系统。

## 项目定位

- 个人主页 / 作品集 / 摄影展示 / 生活记录
- 默认中文主站，预留英文版本
- 内容优先使用静态数据、Markdown 或 MDX 管理
- 后续可部署到 Cloudflare Pages 或 Vercel

## 技术栈

- [Astro](https://astro.build/)：静态站点生成、路由和页面组织
- [React](https://react.dev/)：局部交互组件
- [TypeScript](https://www.typescriptlang.org/)：类型约束
- [animal-island-ui](https://github.com/guokaigdg/animal-island-ui)：岛屿风格 React UI 组件
- Markdown / MDX：生活记录内容预留

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

长文案、项目简介、摄影说明和文章内容不建议使用中文原文反查，后续应使用多语言字段或按语言拆分 MDX 内容。

## MVP 页面规划

- 首页：头像、昵称、身份介绍、精选项目入口、精选照片入口、最近生活记录入口
- 项目页：项目卡片、截图、简介、技术栈、GitHub 地址、线上预览链接
- 摄影页：照片网格或瀑布流、缩略图、懒加载、大图预览、拍摄元信息
- 生活记录页：文章或图文记录列表，支持 Markdown / MDX
- 关于页：个人介绍、技能栈、摄影设备、联系方式和社交链接

## 图片策略

摄影照片体积通常较大，第一版开始预留图片优化结构：

- 列表页只加载缩略图
- 点击预览时再加载原图
- 优先使用 `webp` 或 `avif`
- 图片元素使用懒加载
- 数据结构保留 `thumbnail` 和 `original` 字段
- 大量图片后续可迁移到 Cloudflare R2、OSS、COS、又拍云或图床

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

1. 建立基础布局、导航和页脚。
2. 建立项目、摄影、生活记录的静态数据结构。
3. 完成首页 MVP。
4. 扩展项目页、摄影页、生活记录页和关于页。
5. 根据真实素材补充图片优化和内容管理约定。
