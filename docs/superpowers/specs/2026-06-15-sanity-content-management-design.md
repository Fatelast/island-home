# Sanity 内容管理集成设计

## 1. 背景与目标

Island Home 当前通过 TypeScript 静态数据和 Astro Content Collection 管理相册、文章、项目与个人资料。该方式适合静态 MVP，但照片和内容文件会持续增加仓库体积，且日常更新必须直接修改源码。

本次改造目标：

- 使用 Sanity Studio 管理相册、文章、项目和个人资料。
- 图片存储于 Sanity，不进入 Git 仓库或 Cloudflare Pages 构建产物。
- Astro 在构建阶段读取 Sanity 数据，前台保持纯静态页面。
- Sanity 内容发布后自动触发 Cloudflare Pages 重新构建。
- 自动迁移现有内容，避免人工重复录入。
- 内容正文暂时只维护中文，现有页面 UI 继续支持中英文。
- 在 Sanity 免费额度和 Cloudflare Pages 免费额度内保持现金成本为 0。

## 2. 非目标

本阶段不包含：

- 访客留言功能。
- 多管理员角色和细粒度权限系统。
- 前台实时读取 Sanity API。
- 离线编辑或本地内容与 Sanity 双向同步。
- 自建数据库、对象存储或管理后台。
- 文章正文中英文双语维护。

## 3. 总体架构

Sanity Studio 与 Astro 前台放在同一仓库中维护：

```text
island-home/
├── src/                         Astro 前台
├── studio/                      Sanity Studio
│   ├── schemaTypes/
│   └── sanity.config.ts
└── scripts/
    └── migrate-to-sanity.mjs
```

运行链路：

```text
Sanity Studio
  ├── 相册
  ├── 文章
  ├── 项目
  └── 个人资料
        ↓ 发布内容
Sanity Webhook
        ↓
Cloudflare Pages Deploy Hook
        ↓
Astro 构建时查询 Sanity
        ↓
生成并部署静态页面
```

采用同仓库方案是为了减少仓库、依赖和部署配置数量。Sanity Studio 只承担内容编辑职责，Astro 只承担内容查询和页面生成职责。

## 4. 内容模型

### 4.1 相册 `photo`

| 字段 | 类型 | 要求 |
| --- | --- | --- |
| `title` | string | 必填，中文标题 |
| `alt` | string | 必填，图片无障碍描述 |
| `location` | string | 可选，拍摄地点 |
| `shotDate` | date | 必填，拍摄日期 |
| `camera` | string | 可选，相机信息 |
| `lens` | string | 可选，镜头信息 |
| `image` | image | 必填，启用热点裁剪信息 |
| `tone` | string | 必填，限定为现有卡片色值 |
| `sortOrder` | number | 必填，用于人工排序 |

相册只上传一份原图。列表缩略图和较大预览图由 Sanity Image CDN 根据原图动态生成，不单独维护缩略图资产。

### 4.2 文章 `note`

| 字段 | 类型 | 要求 |
| --- | --- | --- |
| `title` | string | 必填 |
| `slug` | slug | 必填且唯一 |
| `description` | text | 必填，文章摘要 |
| `publishedAt` | datetime | 必填 |
| `tags` | array<string> | 默认空数组 |
| `body` | Portable Text | 必填，支持正文、标题、列表、链接和图片 |

文章正文从 Markdown 转换为 Portable Text。文章路由继续使用现有 slug，避免迁移后 URL 变化。

### 4.3 项目 `project`

| 字段 | 类型 | 要求 |
| --- | --- | --- |
| `title` | string | 必填 |
| `summary` | text | 必填 |
| `status` | string | 必填 |
| `techStack` | array<string> | 默认空数组 |
| `repoUrl` | url | 可选 |
| `demoUrl` | url | 可选 |
| `coverImage` | image | 可选 |
| `coverTone` | string | 必填，无封面时使用 |
| `sortOrder` | number | 必填 |

### 4.4 个人资料 `profile`

`profile` 是单例文档，Studio 中只允许编辑固定文档，不允许创建多份个人资料。

字段包括：

- 身份。
- 关注方向。
- 摄影设备。
- 内容计划。
- 联系链接列表，包括名称和 URL。

### 4.5 草稿与发布

直接使用 Sanity 内置草稿机制：

```text
编辑中 → Draft
点击发布 → Published
内容变更 → Webhook → Cloudflare Pages 构建
```

不增加自定义发布状态字段，避免两套状态产生冲突。

## 5. 前台内容访问层

新增统一内容访问层，页面不直接编写 GROQ 查询：

```text
src/lib/content/
├── client.ts
├── photos.ts
├── notes.ts
├── projects.ts
├── profile.ts
└── types.ts
```

对页面暴露以下接口：

```ts
getPhotos()
getNotes()
getNoteBySlug(slug)
getProjects()
getProfile()
```

内容层负责：

- 执行 GROQ 查询。
- 构建查询使用 `useCdn: false`，确保 Webhook 触发后读取最新发布数据。
- 显式使用 `published` perspective，排除草稿和版本文档。
- 将 Sanity 查询结果映射为页面使用的稳定类型。
- 处理可选字段。
- 统一输出明确的查询错误。
- 隔离 Sanity SDK 与页面组件。

页面组件尽量保持现有属性结构，降低改造范围。现有 `t()` 继续用于导航、按钮和页面 UI 文案；Sanity 中的中文内容在中文和英文页面均直接显示中文。

## 6. 图片策略

图片使用 Sanity Image URL Builder 生成目标尺寸：

- 相册列表使用受限宽度的缩略图 URL。
- 大图预览使用更高宽度和质量的 URL。
- 优先请求自动格式转换后的 WebP 或 AVIF。
- 图片继续使用 `loading="lazy"` 和 `decoding="async"`。
- Sanity 图片 URL 保持远程引用，不下载到 `public` 或 `dist`。

后台上传时应给出合理的图片说明和 alt 文本。前台缺少可选设备信息时隐藏对应字段，不显示无意义占位内容。

## 7. 自动部署

部署平台使用 Cloudflare Pages。

构建环境配置：

```text
PUBLIC_SANITY_PROJECT_ID
PUBLIC_SANITY_DATASET
SANITY_API_VERSION
SITE_URL
```

公开数据集的构建查询不需要读取 Token。迁移脚本使用具有写权限的 Token，但该 Token 只存在于本地环境变量，不配置到前台和浏览器代码中。

`PUBLIC_SANITY_PROJECT_ID` 和 `PUBLIC_SANITY_DATASET` 只用于标识公开内容源，不包含写入权限。所有具有写权限的凭据必须使用非 `PUBLIC_` 环境变量。

自动发布流程：

1. 在 Cloudflare Pages 创建 Deploy Hook。
2. 在 Sanity 项目配置 Webhook。
3. Webhook 监听已发布内容的创建、更新和删除。
4. Webhook 调用 Deploy Hook。
5. Cloudflare Pages 执行测试和构建。
6. 构建成功后切换到新部署。

应避免让草稿的普通保存操作触发部署。

## 8. 故障处理

Sanity 查询失败、返回结构不符合要求或必填内容缺失时：

- Astro 构建失败。
- Cloudflare Pages 不发布不完整版本。
- 上一次成功部署继续在线。
- 构建日志包含内容类型、查询阶段和原始错误信息。

系统不使用旧本地数据静默兜底，避免后台显示已发布而前台仍展示过期内容。

对于单条内容的可选字段缺失，内容层返回可安全渲染的空值，由组件隐藏对应区域，不阻断整个构建。

## 9. 数据迁移

迁移脚本覆盖现有：

- `src/data/photos.ts`
- `src/data/projects.ts`
- `src/data/profile.ts`
- `src/content/notes/*.md`

迁移要求：

- 使用稳定文档 ID，重复执行不会创建重复数据。
- 保留文章 slug、发布日期、标签和摘要。
- 将 Markdown 正文转换为 Portable Text。
- 将现有相册字段映射至新模型。
- 当前没有真实图片时不创建虚假图片资产，后续由后台补充。
- 输出创建、更新、跳过和失败数量。
- 任一转换错误时返回非零退出码。

迁移完成并验证后：

1. 前台停止读取旧本地内容。
2. 旧数据文件暂时保留一轮提交，作为迁移核对依据。
3. 线上验证完成后，再单独确认并删除旧内容文件。

## 10. 测试策略

自动测试覆盖：

- Sanity 环境变量缺失时输出明确错误。
- GROQ 查询结果能映射为前台稳定类型。
- 可选图片、链接、相机或镜头信息缺失时页面仍可构建。
- 文章 slug 唯一。
- 个人资料按单例文档读取。
- 迁移脚本重复执行不产生重复文档。
- Markdown 到 Portable Text 的基础结构转换正确。

发布前执行：

```bash
npm run test
npm run build
```

## 11. 验收标准

- 首页正常生成。
- 相册页展示 Sanity 图片。
- 文章列表和详情页正常生成。
- 项目页和个人资料页正常生成。
- 中文和英文路由均能构建。
- 英文页面的内容区域显示中文内容。
- Git 仓库和 `dist` 不包含后台上传的原图。
- 在 Studio 发布照片后自动触发 Cloudflare Pages。
- 自动部署成功后前台出现新照片。
- 修改文章并发布后详情页更新。
- 撤销发布或删除内容后，对应页面在下一次部署中移除。
- Sanity 查询失败时新部署失败，旧部署继续在线。
- 上传图片不会改变本地 Git 工作区。

## 12. 安全约束

- 不在前台代码、构建产物或 Git 中暴露写入 Token。
- `.env` 文件保持 Git 忽略。
- 迁移 Token 仅在本地执行迁移时使用。
- Deploy Hook URL 仅配置在 Sanity Webhook 中。
- Studio 使用 Sanity 官方身份认证。
- 前台只查询已发布内容。

## 13. 成本与限制

方案以 Sanity 和 Cloudflare Pages 免费额度为前提。达到额度上限时，不自动升级付费套餐，应先清理资产、降低图片尺寸或评估后续付费方案。

主要限制：

- Sanity Studio、API 和图片 CDN 在中国大陆不提供稳定性承诺。
- 前台文本内容为静态构建结果，但图片仍依赖 Sanity CDN。
- 内容发布到前台存在一次 Cloudflare Pages 构建所需的延迟。
- 免费额度和产品条款未来可能调整，实施时以官方最新说明为准。

## 14. 实施边界

实现阶段分为以下部分：

1. 初始化同仓库 Sanity Studio。
2. 定义内容模型和单例资料结构。
3. 建立 Astro 内容访问层和图片 URL 工具。
4. 改造相册、文章、项目和个人资料页面。
5. 编写并执行幂等迁移脚本。
6. 配置 Cloudflare Pages 环境变量、Deploy Hook 和 Sanity Webhook。
7. 完成自动测试、构建和上线验收。

旧内容文件的实际删除不包含在首次迁移改动中，必须在线上验证后另行确认。
