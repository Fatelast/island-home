# Sanity 与 Cloudflare Pages 内容管理实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将相册、文章、项目和个人资料迁移到 Sanity Studio 管理，并由 Cloudflare Pages 在内容发布后自动构建 Astro 静态站点。

**Architecture:** Sanity Studio 作为同仓库下的独立应用部署到 `*.sanity.studio`，Astro 前台通过统一内容访问层在构建时读取已发布内容。Sanity Webhook 调用 Cloudflare Pages Deploy Hook，构建失败时保留上一次成功部署。

**Tech Stack:** Astro 6、React 19、TypeScript、Sanity Studio、`@sanity/client`、`@sanity/image-url`、Portable Text、Cloudflare Pages

---

## 人工操作边界

以下步骤不能只靠仓库代码完成，需要项目所有者登录或授权：

1. 登录 Sanity，创建或选择项目和 `production` 数据集。
2. 创建 Sanity Editor 写入 Token，用于一次性数据迁移。
3. 首次执行 `sanity deploy` 时确认 Studio 域名。
4. 登录 Cloudflare，授权其访问 GitHub 仓库。
5. 创建 Cloudflare Pages 项目和 Deploy Hook。
6. 将 Deploy Hook URL 保存到 Sanity Webhook。
7. 如果使用自定义域名，确认 DNS 变更。

实现代理可以准备所有命令、代码和字段，并在用户完成登录后继续操作，但不能代替用户同意第三方账号授权或读取未提供的私密凭据。

## 文件结构

### 新增

```text
.env.example
studio/
├── package.json
├── sanity.cli.ts
├── sanity.config.ts
├── structure.ts
└── schemaTypes/
    ├── index.ts
    ├── note.ts
    ├── photo.ts
    ├── profile.ts
    ├── project.ts
    └── portableText.ts
src/
├── components/content/PortableText.tsx
└── lib/content/
    ├── client.ts
    ├── config.ts
    ├── image.ts
    ├── mappers.ts
    ├── notes.ts
    ├── photos.ts
    ├── profile.ts
    ├── projects.ts
    ├── queries.ts
    └── types.ts
scripts/
├── migrate-to-sanity.ts
└── migration/
    ├── ids.ts
    ├── markdown.ts
    └── source-data.ts
tests/
├── content.test.ts
└── migration.test.ts
```

### 修改

```text
.gitignore
package.json
package-lock.json
src/components/island/NoteCard.astro
src/components/island/ProjectCard.astro
src/components/photos/PhotoCard.tsx
src/components/photos/PhotoGallery.tsx
src/components/photos/PhotoLightbox.tsx
src/lib/photos.ts
src/pages/island/about/index.astro
src/pages/island/notes/index.astro
src/pages/island/notes/[slug].astro
src/pages/island/photos/index.astro
src/pages/island/photos/[...archive].astro
src/pages/island/photos/data/[...archive].json.ts
src/pages/island/projects/index.astro
tests/photos.test.ts
docs/deployment.md
docs/image-strategy.md
docs/project-knowledge.md
```

首次上线不删除 `src/data/*.ts`、`src/content/notes/*.md` 或 `src/content.config.ts`。

## Task 1：创建 Sanity 项目并初始化 Studio

**Files:**
- Create: `studio/package.json`
- Create: `studio/sanity.cli.ts`
- Create: `studio/sanity.config.ts`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1：由用户完成 Sanity 登录授权**

运行：

```powershell
npx sanity@latest login
```

预期：浏览器完成登录，终端显示当前 Sanity 用户。

- [ ] **Step 2：初始化同仓库 Studio**

运行：

```powershell
npx sanity@latest init --output-path studio
```

选择或创建项目，数据集使用：

```text
production
```

预期：`studio/` 中生成 Sanity Studio 项目，并且没有把 Token 写入仓库。

- [ ] **Step 3：建立环境变量契约**

创建 `.env.example`：

```dotenv
PUBLIC_SANITY_PROJECT_ID=your-project-id
PUBLIC_SANITY_DATASET=production
SANITY_API_VERSION=2026-06-15
SANITY_MIGRATION_TOKEN=local-only-write-token
SITE_URL=https://your-site.pages.dev
```

创建 `studio/.env.example`：

```dotenv
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production
```

更新 `.gitignore`：

```gitignore
.env
.env.*
!.env.example
!studio/.env.example
```

- [ ] **Step 4：配置 Studio**

`studio/sanity.config.ts` 使用环境变量：

```ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

if (!projectId || !dataset) {
  throw new Error('Missing SANITY_STUDIO_PROJECT_ID or SANITY_STUDIO_DATASET');
}

export default defineConfig({
  name: 'island-home',
  title: 'Island Home',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
```

- [ ] **Step 5：验证 Studio 启动**

运行：

```powershell
Set-Location studio
npm install
npm run dev
```

预期：Studio 在本地地址打开，未定义 schema 前只显示空工作区。

- [ ] **Step 6：提交基础 Studio**

```powershell
git add .gitignore .env.example studio
git commit -m "feat: 初始化 Sanity Studio"
```

## Task 2：定义内容模型和单例资料结构

**Files:**
- Create: `studio/schemaTypes/photo.ts`
- Create: `studio/schemaTypes/note.ts`
- Create: `studio/schemaTypes/project.ts`
- Create: `studio/schemaTypes/profile.ts`
- Create: `studio/schemaTypes/portableText.ts`
- Create: `studio/schemaTypes/index.ts`
- Create: `studio/structure.ts`

- [ ] **Step 1：定义 `photo`**

`studio/schemaTypes/photo.ts`：

```ts
import { defineField, defineType } from 'sanity';

export const photo = defineType({
  name: 'photo',
  title: '相册',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '标题', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'alt', title: '图片描述', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'location', title: '拍摄地点', type: 'string' }),
    defineField({ name: 'shotDate', title: '拍摄日期', type: 'date', validation: (rule) => rule.required() }),
    defineField({ name: 'camera', title: '相机', type: 'string' }),
    defineField({ name: 'lens', title: '镜头', type: 'string' }),
    defineField({
      name: 'image',
      title: '照片',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.custom((value) => (
        value ? true : '迁移占位内容可以暂缺图片，新内容发布前应上传图片'
      )).warning(),
    }),
    defineField({
      name: 'tone',
      title: '占位色',
      type: 'string',
      initialValue: 'teal',
      options: {
        list: [
          { title: '青色', value: 'teal' },
          { title: '金色', value: 'gold' },
          { title: '粉色', value: 'pink' },
          { title: '绿色', value: 'green' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'sortOrder', title: '排序', type: 'number', initialValue: 0 }),
  ],
});
```

- [ ] **Step 2：定义文章、项目和资料**

`studio/schemaTypes/portableText.ts`：

```ts
import { defineArrayMember, defineField, defineType } from 'sanity';

export const blockContent = defineType({
  name: 'blockContent',
  title: '正文',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: '正文', value: 'normal' },
        { title: '一级标题', value: 'h1' },
        { title: '二级标题', value: 'h2' },
        { title: '三级标题', value: 'h3' },
      ],
      marks: {
        annotations: [
          {
            name: 'link',
            title: '链接',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (rule) => rule.required(),
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: '图片描述',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
});
```

`studio/schemaTypes/note.ts`：

```ts
import { defineField, defineType } from 'sanity';

export const note = defineType({
  name: 'note',
  title: '文章',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '标题', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      title: '访问路径',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'description', title: '摘要', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: 'publishedAt', title: '发布日期', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: [],
    }),
    defineField({ name: 'body', title: '正文', type: 'blockContent', validation: (rule) => rule.required() }),
  ],
});
```

`studio/schemaTypes/project.ts`：

```ts
import { defineField, defineType } from 'sanity';

export const project = defineType({
  name: 'project',
  title: '项目',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '标题', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'summary', title: '简介', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: 'status', title: '状态', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'techStack',
      title: '技术栈',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: [],
    }),
    defineField({ name: 'repoUrl', title: '仓库地址', type: 'url' }),
    defineField({ name: 'demoUrl', title: '预览地址', type: 'url' }),
    defineField({ name: 'coverImage', title: '封面', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'coverTone',
      title: '占位色',
      type: 'string',
      options: {
        list: [
          { title: '薄荷绿', value: 'mint' },
          { title: '日落色', value: 'sunset' },
          { title: '天空蓝', value: 'sky' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'sortOrder', title: '排序', type: 'number', initialValue: 0 }),
  ],
});
```

`studio/schemaTypes/profile.ts`：

```ts
import { defineArrayMember, defineField, defineType } from 'sanity';

export const profile = defineType({
  name: 'profile',
  title: '个人资料',
  type: 'document',
  fields: [
    defineField({
      name: 'facts',
      title: '基础信息',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', title: '名称', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'value', title: '内容', type: 'string', validation: (rule) => rule.required() }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'value' },
          },
        }),
      ],
      initialValue: [],
    }),
    defineField({
      name: 'links',
      title: '联系链接',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', title: '名称', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'href', title: 'URL', type: 'url', validation: (rule) => rule.required() }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'href' },
          },
        }),
      ],
      initialValue: [],
    }),
  ],
});
```

`studio/schemaTypes/index.ts`：

```ts
import { blockContent } from './portableText';
import { note } from './note';
import { photo } from './photo';
import { profile } from './profile';
import { project } from './project';

export const schemaTypes = [
  blockContent,
  photo,
  note,
  project,
  profile,
];
```

- [ ] **Step 3：限制个人资料为单例**

`studio/structure.ts`：

```ts
import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) => S.list()
  .title('内容管理')
  .items([
    S.documentTypeListItem('photo').title('相册'),
    S.documentTypeListItem('note').title('文章'),
    S.documentTypeListItem('project').title('项目'),
    S.listItem()
      .title('个人资料')
      .child(S.document().schemaType('profile').documentId('profile')),
  ]);
```

并在 Studio 配置中禁止对 `profile` 执行重复、删除和新建操作。

`studio/sanity.config.ts` 增加：

```ts
document: {
  actions: (previous, context) => {
    if (context.schemaType !== 'profile') {
      return previous;
    }

    return previous.filter(({ action }) => (
      action !== 'delete' && action !== 'duplicate'
    ));
  },
},
```

- [ ] **Step 4：运行 Sanity 官方 schema 校验**

运行：

```powershell
Set-Location studio
npx sanity@latest schema validate
npm run build
```

预期：schema 校验无错误，Studio 构建成功。

- [ ] **Step 5：提交内容模型**

```powershell
git add studio/schemaTypes studio/structure.ts studio/sanity.config.ts
git commit -m "feat: 定义 Sanity 内容模型"
```

## Task 3：建立前台内容类型、配置和客户端

**Files:**
- Create: `src/lib/content/types.ts`
- Create: `src/lib/content/config.ts`
- Create: `src/lib/content/client.ts`
- Create: `src/lib/content/mappers.ts`
- Create: `tests/content.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1：安装前台依赖**

运行：

```powershell
npm install @sanity/client @sanity/image-url @portabletext/react @portabletext/types
```

- [ ] **Step 2：写环境配置失败测试**

`tests/content.test.ts`：

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSanityConfig } from '../src/lib/content/config.ts';

test('rejects incomplete Sanity configuration', () => {
  assert.throws(
    () => resolveSanityConfig({}),
    /PUBLIC_SANITY_PROJECT_ID/,
  );
});

test('builds public read configuration without a token', () => {
  assert.deepEqual(resolveSanityConfig({
    PUBLIC_SANITY_PROJECT_ID: 'abc123',
    PUBLIC_SANITY_DATASET: 'production',
    SANITY_API_VERSION: '2026-06-15',
  }), {
    projectId: 'abc123',
    dataset: 'production',
    apiVersion: '2026-06-15',
  });
});
```

- [ ] **Step 3：运行测试确认失败**

运行：

```powershell
node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/content.test.ts
```

预期：FAIL，提示 `resolveSanityConfig` 不存在。

- [ ] **Step 4：实现配置和客户端**

`src/lib/content/config.ts`：

```ts
interface SanityEnvironment {
  PUBLIC_SANITY_PROJECT_ID?: string;
  PUBLIC_SANITY_DATASET?: string;
  SANITY_API_VERSION?: string;
}

export function resolveSanityConfig(environment: SanityEnvironment) {
  const projectId = environment.PUBLIC_SANITY_PROJECT_ID;
  const dataset = environment.PUBLIC_SANITY_DATASET;
  const apiVersion = environment.SANITY_API_VERSION;

  if (!projectId) {
    throw new Error('Missing PUBLIC_SANITY_PROJECT_ID');
  }
  if (!dataset) {
    throw new Error('Missing PUBLIC_SANITY_DATASET');
  }
  if (!apiVersion) {
    throw new Error('Missing SANITY_API_VERSION');
  }

  return { projectId, dataset, apiVersion };
}
```

`src/lib/content/client.ts`：

```ts
import { createClient } from '@sanity/client';

import { resolveSanityConfig } from './config';

const config = resolveSanityConfig({
  PUBLIC_SANITY_PROJECT_ID: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET: import.meta.env.PUBLIC_SANITY_DATASET,
  SANITY_API_VERSION: import.meta.env.SANITY_API_VERSION,
});

export const sanityClient = createClient({
  ...config,
  useCdn: false,
  perspective: 'published',
});
```

- [ ] **Step 5：定义稳定前台类型**

`src/lib/content/types.ts` 包含：

```ts
export interface PhotoItem {
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
  original?: string;
  color: 'teal' | 'gold' | 'pink' | 'green';
}

export interface NoteSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
}

export interface NoteDetail extends NoteSummary {
  body: import('@portabletext/types').PortableTextBlock[];
}

export interface ProjectItem {
  id: string;
  title: string;
  summary: string;
  status: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  coverImage?: string;
  coverTone: 'mint' | 'sunset' | 'sky';
}

export interface ProfileFact {
  label: string;
  value: string;
}

export interface ProfileLink {
  label: string;
  href: string;
}

export interface Profile {
  facts: ProfileFact[];
  links: ProfileLink[];
}
```

- [ ] **Step 6：运行配置测试**

运行：

```powershell
node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/content.test.ts
```

预期：PASS。

- [ ] **Step 7：提交内容访问基础设施**

```powershell
git add package.json package-lock.json src/lib/content tests/content.test.ts
git commit -m "feat: 建立 Sanity 内容访问层"
```

## Task 4：实现相册查询和 Sanity 图片 URL

**Files:**
- Create: `src/lib/content/image.ts`
- Create: `src/lib/content/queries.ts`
- Create: `src/lib/content/photos.ts`
- Modify: `src/lib/content/mappers.ts`
- Modify: `tests/content.test.ts`
- Modify: `src/lib/photos.ts`
- Modify: `tests/photos.test.ts`
- Modify: `src/components/photos/PhotoCard.tsx`
- Modify: `src/components/photos/PhotoGallery.tsx`
- Modify: `src/components/photos/PhotoLightbox.tsx`

- [ ] **Step 1：写相册映射测试**

测试输入使用 Sanity 图片资产元数据：

```ts
test('maps a Sanity photo to the existing gallery contract', () => {
  const result = mapPhotoDocument({
    _id: 'photo-evening',
    title: '傍晚的海风',
    alt: '海边日落',
    location: '海边步道',
    shotDate: '2026-05-18',
    camera: 'Sony A7C II',
    lens: '35mm F1.8',
    tone: 'teal',
    image: {
      asset: { _ref: 'image-example-6000x4000-jpg' },
    },
    dimensions: { width: 6000, height: 4000 },
  }, {
    thumbnail: 'https://cdn.sanity.io/photo.jpg?w=1200',
    original: 'https://cdn.sanity.io/photo.jpg?w=2400',
  });

  assert.equal(result.id, 'photo-evening');
  assert.equal(result.width, 6000);
  assert.equal(result.height, 4000);
  assert.match(result.thumbnail ?? '', /w=1200/);
  assert.match(result.original ?? '', /w=2400/);
});
```

- [ ] **Step 2：运行测试确认失败**

运行：

```powershell
node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/content.test.ts
```

预期：FAIL，提示 `mapPhotoDocument` 不存在。

- [ ] **Step 3：实现图片 URL 工具和查询**

`src/lib/content/image.ts`：

```ts
import imageUrlBuilder from '@sanity/image-url';

interface ImageConfiguration {
  projectId: string;
  dataset: string;
}

export function createPhotoImageUrls(
  configuration: ImageConfiguration,
  source: unknown,
) {
  const builder = imageUrlBuilder(configuration);

  return {
    thumbnail: builder.image(source).width(1200).fit('max').auto('format').url(),
    original: builder.image(source).width(2400).fit('max').auto('format').url(),
  };
}
```

相册 GROQ 投影必须读取：

```groq
*[_type == "photo"] | order(sortOrder asc, shotDate desc) {
  _id,
  title,
  alt,
  location,
  shotDate,
  camera,
  lens,
  tone,
  image,
  "dimensions": image.asset->metadata.dimensions
}
```

- [ ] **Step 4：实现 `getPhotos()`**

`src/lib/content/mappers.ts`：

```ts
import type { PhotoItem } from './types';

interface PhotoDocument {
  _id: string;
  title: string;
  alt: string;
  location?: string;
  shotDate: string;
  camera?: string;
  lens?: string;
  tone?: PhotoItem['color'];
  image?: unknown;
  dimensions?: {
    width?: number;
    height?: number;
  };
}

interface PhotoUrls {
  thumbnail?: string;
  original?: string;
}

export function mapPhotoDocument(
  document: PhotoDocument,
  urls: PhotoUrls = {},
): PhotoItem {
  return {
    id: document._id,
    title: document.title,
    alt: document.alt,
    location: document.location ?? '',
    date: document.shotDate,
    camera: document.camera ?? '',
    lens: document.lens ?? '',
    width: document.dimensions?.width ?? 1600,
    height: document.dimensions?.height ?? 1067,
    thumbnail: urls.thumbnail,
    original: urls.original,
    color: document.tone ?? 'teal',
  };
}
```

`src/lib/content/photos.ts`：

```ts
import { sanityClient, sanityConfig } from './client';
import { createPhotoImageUrls } from './image';
import { mapPhotoDocument } from './mappers';
import { PHOTO_QUERY } from './queries';

import type { PhotoItem } from './types';

export async function getPhotos(): Promise<PhotoItem[]> {
  const documents = await sanityClient.fetch(PHOTO_QUERY);

  return documents.map((document: Parameters<typeof mapPhotoDocument>[0]) => {
    const urls = document.image
      ? createPhotoImageUrls(sanityConfig, document.image)
      : {};

    return mapPhotoDocument(document, urls);
  });
}
```

`src/lib/content/client.ts` 需要把已解析配置导出：

```ts
export const sanityConfig = resolveSanityConfig({
  PUBLIC_SANITY_PROJECT_ID: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET: import.meta.env.PUBLIC_SANITY_DATASET,
  SANITY_API_VERSION: import.meta.env.SANITY_API_VERSION,
});

export const sanityClient = createClient({
  ...sanityConfig,
  useCdn: false,
  perspective: 'published',
});
```

没有图片或尺寸元数据时保留占位图所需默认宽高，不生成损坏 URL。

- [ ] **Step 5：迁移相册类型导入**

将以下文件的 `PhotoItem` 导入改为：

```ts
import type { PhotoItem } from '../../lib/content/types';
```

`src/lib/photos.ts` 和 `tests/photos.test.ts` 使用：

```ts
import type { PhotoItem } from './content/types';
```

- [ ] **Step 6：运行相册和内容测试**

运行：

```powershell
npm run test:photos
node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/content.test.ts
```

预期：全部 PASS。

- [ ] **Step 7：提交相册内容层**

```powershell
git add src/lib/content src/lib/photos.ts src/components/photos tests/content.test.ts tests/photos.test.ts
git commit -m "feat: 接入 Sanity 相册数据"
```

## Task 5：将相册归档页面切换到 Sanity

**Files:**
- Modify: `src/pages/island/photos/index.astro`
- Modify: `src/pages/island/photos/[...archive].astro`
- Modify: `src/pages/island/photos/data/[...archive].json.ts`
- Modify: `tests/photos.test.ts`

- [ ] **Step 1：写静态路由异步读取测试**

在 `tests/photos.test.ts` 增加源码约束：

```ts
test('photo routes read through the Sanity content layer', () => {
  const rootPage = readFileSync(
    new URL('../src/pages/island/photos/index.astro', import.meta.url),
    'utf8',
  );

  assert.match(rootPage, /getPhotos/);
  assert.doesNotMatch(rootPage, /data\/photos/);
});
```

- [ ] **Step 2：运行测试确认失败**

运行：

```powershell
npm run test:photos
```

预期：FAIL，因为页面仍读取 `src/data/photos.ts`。

- [ ] **Step 3：更新根相册页**

将根相册页的数据初始化替换为：

```ts
import { getPhotos } from '../../../lib/content/photos';

const photos = await getPhotos();
const pageData = buildPhotoArchivePages(photos)[0];
const archiveOptions = getPhotoArchiveOptions(photos);
```

- [ ] **Step 4：更新归档和 JSON 静态路径**

两个 `getStaticPaths()` 改为 `async`，每个函数只调用一次 `getPhotos()`，再构建所有静态归档和 JSON 数据页。

- [ ] **Step 5：运行测试**

```powershell
npm run test
```

预期：相册测试通过。全量构建在 Task 9 完成数据迁移后执行。

- [ ] **Step 6：提交相册页面迁移**

```powershell
git add src/pages/island/photos tests/photos.test.ts
git commit -m "refactor: 相册页面改用 Sanity 数据"
```

## Task 6：迁移项目和个人资料页面

**Files:**
- Create: `src/lib/content/projects.ts`
- Create: `src/lib/content/profile.ts`
- Modify: `src/lib/content/queries.ts`
- Modify: `src/lib/content/mappers.ts`
- Modify: `src/components/island/ProjectCard.astro`
- Modify: `src/pages/island/projects/index.astro`
- Modify: `src/pages/island/about/index.astro`
- Modify: `tests/content.test.ts`

- [ ] **Step 1：写映射测试**

在 `tests/content.test.ts` 增加：

```ts
test('maps optional project links to undefined', () => {
  const result = mapProjectDocument({
    _id: 'project-one',
    title: '项目',
    summary: '简介',
    status: '进行中',
    techStack: ['Astro'],
    coverTone: 'mint',
  });

  assert.equal(result.repoUrl, undefined);
  assert.equal(result.demoUrl, undefined);
});

test('maps profile arrays and rejects a missing singleton', () => {
  assert.deepEqual(mapProfileDocument({
    facts: [{ label: '身份', value: '前端开发者' }],
  }), {
    facts: [{ label: '身份', value: '前端开发者' }],
    links: [],
  });

  assert.throws(() => mapProfileDocument(null), /profile singleton/i);
});
```

- [ ] **Step 2：运行测试确认失败**

运行：

```powershell
node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/content.test.ts
```

预期：FAIL，因为项目和资料查询尚未实现。

- [ ] **Step 3：实现查询接口**

`src/lib/content/mappers.ts` 增加：

```ts
import type { Profile, ProjectItem } from './types';

export function mapProjectDocument(document: {
  _id: string;
  title: string;
  summary: string;
  status: string;
  techStack?: string[];
  repoUrl?: string;
  demoUrl?: string;
  coverImage?: string;
  coverTone: ProjectItem['coverTone'];
}): ProjectItem {
  return {
    id: document._id,
    title: document.title,
    summary: document.summary,
    status: document.status,
    techStack: document.techStack ?? [],
    repoUrl: document.repoUrl || undefined,
    demoUrl: document.demoUrl || undefined,
    coverImage: document.coverImage || undefined,
    coverTone: document.coverTone,
  };
}

export function mapProfileDocument(document: {
  facts?: Profile['facts'];
  links?: Profile['links'];
} | null): Profile {
  if (!document) {
    throw new Error('Missing profile singleton document');
  }

  return {
    facts: document.facts ?? [],
    links: document.links ?? [],
  };
}
```

`src/lib/content/queries.ts` 增加：

```groq
export const PROJECTS_QUERY = `*[_type == "project"]
  | order(sortOrder asc, _createdAt asc) {
    _id,
    title,
    summary,
    status,
    techStack,
    repoUrl,
    demoUrl,
    "coverImage": coverImage.asset->url,
    coverTone
  }`;

export const PROFILE_QUERY = `*[_id == "profile" && _type == "profile"][0] {
  facts,
  links
}`;
```

`src/lib/content/projects.ts`：

```ts
import { sanityClient } from './client';
import { mapProjectDocument } from './mappers';
import { PROJECTS_QUERY } from './queries';

import type { ProjectItem } from './types';

export async function getProjects(): Promise<ProjectItem[]> {
  const documents = await sanityClient.fetch(PROJECTS_QUERY);
  return documents.map(mapProjectDocument);
}
```

`src/lib/content/profile.ts`：

```ts
import { sanityClient } from './client';
import { mapProfileDocument } from './mappers';
import { PROFILE_QUERY } from './queries';

import type { Profile } from './types';

export async function getProfile(): Promise<Profile> {
  const document = await sanityClient.fetch(PROFILE_QUERY);
  return mapProfileDocument(document);
}
```

- [ ] **Step 4：更新页面**

项目页：

```ts
const projects = await getProjects();
```

个人资料页：

```ts
const profile = await getProfile();
```

`src/components/island/ProjectCard.astro` 将：

```astro
<span>{t(locale, project.status)}</span>
<h2>{t(locale, project.title)}</h2>
<p>{t(locale, project.summary)}</p>
```

改为：

```astro
<span>{project.status}</span>
<h2>{project.title}</h2>
<p>{project.summary}</p>
```

个人资料页将 `fact.label`、`fact.value` 和 `link.label` 直接输出。按钮、栏目标题和其他 UI 文案继续调用 `t()`。

- [ ] **Step 5：运行测试**

```powershell
npm run test
```

预期：内容映射和页面源码约束测试通过。全量构建在 Task 9 导入单例资料后执行。

- [ ] **Step 6：提交项目与资料迁移**

```powershell
git add src/lib/content src/components/island/ProjectCard.astro src/pages/island/projects src/pages/island/about tests/content.test.ts
git commit -m "refactor: 项目和资料改用 Sanity 数据"
```

## Task 7：迁移文章和 Portable Text 渲染

**Files:**
- Create: `src/lib/content/notes.ts`
- Create: `src/components/content/PortableText.tsx`
- Modify: `src/lib/content/queries.ts`
- Modify: `src/lib/content/mappers.ts`
- Modify: `src/components/island/NoteCard.astro`
- Modify: `src/pages/island/notes/index.astro`
- Modify: `src/pages/island/notes/[slug].astro`
- Modify: `tests/content.test.ts`

- [ ] **Step 1：写文章映射和 slug 测试**

```ts
test('maps a published note and rejects missing slugs', () => {
  const source = {
    _id: 'note-one',
    title: '第一篇文章',
    slug: 'first-note',
    description: '摘要',
    publishedAt: '2026-06-05T00:00:00.000Z',
    tags: ['生活'],
    body: [],
  };
  const note = mapNoteDocument(source);

  assert.equal(note.slug, 'first-note');
  assert.throws(() => mapNoteDocument({ ...source, slug: '' }), /slug/);
});
```

- [ ] **Step 2：运行测试确认失败**

运行：

```powershell
node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/content.test.ts
```

预期：FAIL。

- [ ] **Step 3：实现文章查询**

`src/lib/content/mappers.ts` 增加：

```ts
import type { NoteDetail } from './types';
import type { PortableTextBlock } from '@portabletext/types';

export function mapNoteDocument(document: {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  publishedAt: string;
  tags?: string[];
  body?: PortableTextBlock[];
}): NoteDetail {
  if (!document.slug) {
    throw new Error(`Missing slug for note ${document._id}`);
  }

  return {
    id: document._id,
    slug: document.slug,
    title: document.title,
    description: document.description,
    publishedAt: document.publishedAt,
    tags: document.tags ?? [],
    body: document.body ?? [],
  };
}
```

`src/lib/content/queries.ts` 增加：

```ts
export const NOTES_QUERY = `*[_type == "note"]
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    publishedAt,
    tags,
    body
  }`;

export const NOTE_BY_SLUG_QUERY = `*[
  _type == "note" && slug.current == $slug
][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  publishedAt,
  tags,
  body
}`;
```

`src/lib/content/notes.ts`：

```ts
import { sanityClient } from './client';
import { mapNoteDocument } from './mappers';
import { NOTES_QUERY, NOTE_BY_SLUG_QUERY } from './queries';

import type { NoteDetail, NoteSummary } from './types';

export async function getNotes(): Promise<NoteSummary[]> {
  const documents = await sanityClient.fetch(NOTES_QUERY);
  return documents.map(mapNoteDocument);
}

export async function getNoteBySlug(slug: string): Promise<NoteDetail> {
  const document = await sanityClient.fetch(NOTE_BY_SLUG_QUERY, { slug });
  if (!document) {
    throw new Error(`Missing published note for slug: ${slug}`);
  }
  return mapNoteDocument(document);
}
```

列表按 `publishedAt desc` 排序，详情仅查询指定 slug。

- [ ] **Step 4：实现 Portable Text 组件**

`src/components/content/PortableText.tsx`：

```tsx
import { PortableText as PortableTextRenderer } from '@portabletext/react';

import type { PortableTextBlock } from '@portabletext/types';

interface Props {
  value: PortableTextBlock[];
}

export default function PortableText({ value }: Props) {
  return (
    <PortableTextRenderer
      value={value}
      components={{
        marks: {
          link: ({ children, value: mark }) => (
            <a href={mark?.href} rel="noreferrer">
              {children}
            </a>
          ),
        },
      }}
    />
  );
}
```

Portable Text 图片块通过 Sanity Image URL Builder 生成 URL，并要求使用后台维护的 alt 文本。

- [ ] **Step 5：更新文章页面**

文章列表：

```ts
const notes = await getNotes();
```

详情页静态路径：

```ts
export async function getStaticPaths() {
  const notes = await getNotes();

  return notes.map((note) => ({
    params: { slug: note.slug },
    props: { slug: note.slug },
  }));
}

const { slug } = Astro.props;
const note = await getNoteBySlug(slug);
```

正文改为：

```astro
<PortableText value={note.body} />
```

- [ ] **Step 6：运行测试**

```powershell
npm run test
```

预期：文章映射与 Portable Text 测试通过。文章静态路由在 Task 9 数据迁移后执行构建验证。

- [ ] **Step 7：提交文章迁移**

```powershell
git add src/lib/content src/components/content src/components/island/NoteCard.astro src/pages/island/notes tests/content.test.ts
git commit -m "refactor: 文章改用 Sanity Portable Text"
```

## Task 8：编写幂等迁移脚本

**Files:**
- Create: `scripts/migrate-to-sanity.ts`
- Create: `scripts/migration/ids.ts`
- Create: `scripts/migration/markdown.ts`
- Create: `scripts/migration/source-data.ts`
- Create: `tests/migration.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1：安装迁移解析依赖**

运行：

```powershell
npm install gray-matter mdast-util-from-markdown
```

- [ ] **Step 2：写稳定 ID 和 Markdown 转换测试**

`tests/migration.test.ts`：

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { getDocumentId } from '../scripts/migration/ids.ts';
import { markdownToPortableText } from '../scripts/migration/markdown.ts';

test('creates stable Sanity document ids', () => {
assert.equal(getDocumentId('photo', 'evening-sea-breeze'), 'photo-evening-sea-breeze');
assert.equal(getDocumentId('note', 'photo-workflow'), 'note-photo-workflow');
});

test('converts headings, paragraphs, links, and lists', () => {
  const blocks = markdownToPortableText(`
## 标题

正文包含[链接](https://example.com)。

- 第一项
- 第二项
  `);

  assert.equal(blocks[0].style, 'h2');
  assert.equal(blocks[1].style, 'normal');
  assert.equal(blocks[1].markDefs[0].href, 'https://example.com');
  assert.equal(blocks[2].listItem, 'bullet');
  assert.equal(blocks[3].listItem, 'bullet');
});
```

- [ ] **Step 3：运行测试确认失败**

```powershell
node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/migration.test.ts
```

预期：FAIL。

- [ ] **Step 4：实现结构化 Markdown 转换**

`scripts/migration/ids.ts`：

```ts
export function getDocumentId(type: string, sourceId: string): string {
  return `${type}-${sourceId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

`scripts/migration/markdown.ts` 使用 `mdast-util-from-markdown` 解析 AST，不通过正则拆正文。实现以下结构：

```ts
import { createHash } from 'node:crypto';

import { fromMarkdown } from 'mdast-util-from-markdown';

const keyFor = (value: string) => createHash('sha1')
  .update(value)
  .digest('hex')
  .slice(0, 12);

function inlineText(node: any): string {
  if (node.type === 'text' || node.type === 'inlineCode') {
    return node.value;
  }
  return (node.children ?? []).map(inlineText).join('');
}

function toChildren(nodes: any[], blockKey: string) {
  const markDefs: Array<{
    _key: string;
    _type: 'link';
    href: string;
  }> = [];
  const children: Array<{
    _key: string;
    _type: 'span';
    text: string;
    marks: string[];
  }> = [];

  const visit = (node: any, marks: string[] = []) => {
    if (node.type === 'text' || node.type === 'inlineCode') {
      children.push({
        _key: keyFor(`${blockKey}:${children.length}:${node.value}`),
        _type: 'span',
        text: node.value,
        marks,
      });
      return;
    }

    if (node.type === 'strong' || node.type === 'emphasis') {
      const decorator = node.type === 'strong' ? 'strong' : 'em';
      node.children.forEach((child: any) => visit(child, [...marks, decorator]));
      return;
    }

    if (node.type === 'link') {
      const markKey = keyFor(`${blockKey}:link:${node.url}`);
      markDefs.push({
        _key: markKey,
        _type: 'link',
        href: node.url,
      });
      node.children.forEach((child: any) => visit(child, [...marks, markKey]));
      return;
    }

    throw new Error(`Unsupported inline Markdown node: ${node.type}`);
  };

  nodes.forEach((node) => visit(node));
  return { children, markDefs };
}

function toBlock(
  node: any,
  index: number,
  options: { listItem?: 'bullet' | 'number'; level?: number } = {},
) {
  const blockKey = keyFor(`${index}:${node.type}:${inlineText(node)}`);
  const { children, markDefs } = toChildren(node.children ?? [], blockKey);

  return {
    _key: blockKey,
    _type: 'block',
    style: node.type === 'heading' ? `h${node.depth}` : 'normal',
    markDefs,
    children,
    ...options,
  };
}

export function markdownToPortableText(markdown: string) {
  const tree = fromMarkdown(markdown);
  const blocks: any[] = [];

  tree.children.forEach((node: any, index: number) => {
    if (node.type === 'paragraph') {
      blocks.push(toBlock(node, index));
      return;
    }

    if (node.type === 'heading' && node.depth >= 1 && node.depth <= 3) {
      blocks.push(toBlock(node, index));
      return;
    }

    if (node.type === 'list') {
      node.children.forEach((item: any, itemIndex: number) => {
        const paragraph = item.children.find((child: any) => child.type === 'paragraph');
        if (!paragraph) {
          throw new Error(`Unsupported empty list item at ${index}:${itemIndex}`);
        }
        blocks.push(toBlock(paragraph, index + itemIndex / 100, {
          listItem: node.ordered ? 'number' : 'bullet',
          level: 1,
        }));
      });
      return;
    }

    throw new Error(`Unsupported Markdown node: ${node.type}`);
  });

  return blocks;
}
```

遇到不支持的节点时抛出包含文件名和节点类型的错误。

- [ ] **Step 5：实现幂等写入**

`scripts/migration/source-data.ts`：

```ts
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';

import { photos } from '../../src/data/photos.ts';
import { profileFacts, profileLinks } from '../../src/data/profile.ts';
import { projects } from '../../src/data/projects.ts';

export async function loadSourceData() {
  const notesDirectory = path.resolve('src/content/notes');
  const files = (await readdir(notesDirectory))
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));
  const notes = await Promise.all(files.map(async (file) => {
    const source = await readFile(path.join(notesDirectory, file), 'utf8');
    const parsed = matter(source);

    return {
      slug: path.basename(file, path.extname(file)),
      data: parsed.data,
      body: parsed.content,
    };
  }));

  return {
    photos,
    projects,
    profileFacts,
    profileLinks,
    notes,
  };
}
```

`scripts/migrate-to-sanity.ts` 使用 `createOrReplace`：

```ts
import { createClient } from '@sanity/client';

import { getDocumentId } from './migration/ids.ts';
import { markdownToPortableText } from './migration/markdown.ts';
import { loadSourceData } from './migration/source-data.ts';

const token = process.env.SANITY_MIGRATION_TOKEN;
const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION;

if (!token) {
  throw new Error('Missing SANITY_MIGRATION_TOKEN');
}
if (!projectId || !dataset || !apiVersion) {
  throw new Error('Missing public Sanity migration configuration');
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const source = await loadSourceData();
const documents = [
  ...source.photos.map((photo, index) => ({
    _id: getDocumentId('photo', photo.id),
    _type: 'photo',
    title: photo.title,
    alt: photo.alt,
    location: photo.location,
    shotDate: photo.date,
    camera: photo.camera,
    lens: photo.lens,
    tone: photo.color,
    sortOrder: index,
  })),
  ...source.projects.map((project, index) => ({
    _id: getDocumentId('project', String(index + 1)),
    _type: 'project',
    ...project,
    sortOrder: index,
  })),
  {
    _id: 'profile',
    _type: 'profile',
    facts: source.profileFacts.map((fact, index) => ({
      _key: getDocumentId('fact', String(index)),
      _type: 'object',
      ...fact,
    })),
    links: source.profileLinks.map((link, index) => ({
      _key: getDocumentId('link', String(index)),
      _type: 'object',
      ...link,
    })),
  },
  ...source.notes.map((note) => ({
    _id: getDocumentId('note', note.slug),
    _type: 'note',
    title: note.data.title,
    slug: { _type: 'slug', current: note.slug },
    description: note.data.description,
    publishedAt: new Date(note.data.pubDate).toISOString(),
    tags: note.data.tags ?? [],
    body: markdownToPortableText(note.body),
  })),
];

const results = await Promise.allSettled(
  documents.map((document) => client.createOrReplace(document)),
);
const failed = results.filter(({ status }) => status === 'rejected');

console.log(`documents: created/updated ${results.length - failed.length}`);
console.log(`failed: ${failed.length}`);

if (failed.length > 0) {
  failed.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(result.reason);
    }
  });
  process.exitCode = 1;
}
```

项目 ID 使用现有数组顺序生成稳定值；后续如需重排，只修改 `sortOrder`，不修改 `_id`。脚本不得打印 Token。

- [ ] **Step 6：增加迁移命令**

根 `package.json`：

```json
"migrate:sanity": "node --env-file=.env --disable-warning=ExperimentalWarning --experimental-strip-types scripts/migrate-to-sanity.ts",
"test:migration": "node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/migration.test.ts"
```

总测试命令包含新测试。

- [ ] **Step 7：运行测试**

```powershell
npm run test
```

预期：全部 PASS。

- [ ] **Step 8：提交迁移脚本**

```powershell
git add scripts tests/migration.test.ts package.json package-lock.json
git commit -m "feat: 添加 Sanity 内容迁移脚本"
```

## Task 9：执行首次迁移并核对后台

**Files:**
- No repository changes expected

- [ ] **Step 1：由用户创建 Editor Token**

在 Sanity Manage 的 API Tokens 中创建仅用于迁移的 Editor Token。

将其写入本地 `.env`：

```dotenv
SANITY_MIGRATION_TOKEN=...
```

Token 不发送到聊天、不提交 Git。

- [ ] **Step 2：执行迁移**

运行：

```powershell
npm run migrate:sanity
```

预期输出包含：

```text
documents: created/updated 10
failed: 0
```

- [ ] **Step 3：重复执行验证幂等**

再次运行：

```powershell
npm run migrate:sanity
```

预期：文档总数不增加，没有重复 slug。

- [ ] **Step 4：在 Studio 核对**

逐项确认：

- 相册字段和顺序正确。
- 文章 slug、日期、标签和正文正确。
- 项目链接正确。
- 只有一个 `profile` 文档。

- [ ] **Step 5：撤销迁移 Token**

迁移确认完成后，在 Sanity Manage 删除该 Token，并从本地 `.env` 移除。

## Task 10：部署 Sanity Studio

**Files:**
- Modify: `docs/deployment.md`

- [ ] **Step 1：构建 Studio**

```powershell
Set-Location studio
npm run build
```

预期：Studio 构建成功。

- [ ] **Step 2：首次部署 Studio**

```powershell
npx sanity@latest deploy
```

用户确认唯一域名，例如：

```text
island-home.sanity.studio
```

预期：登录后可以管理相册、文章、项目和个人资料。

- [ ] **Step 3：记录部署方式**

在 `docs/deployment.md` 记录 Studio 更新命令：

```powershell
Set-Location studio
npm install
npx sanity@latest deploy
```

- [ ] **Step 4：提交部署文档**

```powershell
git add docs/deployment.md
git commit -m "docs: 补充 Sanity Studio 部署说明"
```

## Task 11：部署 Cloudflare Pages

**Files:**
- Modify: `docs/deployment.md`
- Modify: `docs/image-strategy.md`
- Modify: `docs/project-knowledge.md`

- [ ] **Step 1：推送实现分支**

将完成并验证的分支推送到 GitHub。Cloudflare Pages 只能选择已推送的分支作为生产分支。

- [ ] **Step 2：由用户授权 Cloudflare 访问 GitHub**

Cloudflare 控制台路径：

```text
Workers & Pages
→ Create application
→ Pages
→ Connect to Git
```

选择 `island-home` 仓库。

- [ ] **Step 3：配置构建**

```text
Production branch: 实际生产分支
Framework preset: Astro
Root directory: /
Build command: npm run test && npm run build
Build output directory: dist
Node version: 22.12.0
```

生产环境变量：

```text
PUBLIC_SANITY_PROJECT_ID=<项目 ID>
PUBLIC_SANITY_DATASET=production
SANITY_API_VERSION=2026-06-15
SITE_URL=https://<项目名>.pages.dev
```

不要配置 `SANITY_MIGRATION_TOKEN`。

- [ ] **Step 4：执行首次部署**

点击 `Save and Deploy`。

预期：

- Cloudflare 安装根项目依赖。
- `npm run build` 成功。
- `dist` 被发布。
- `*.pages.dev` 可以访问全部页面。

- [ ] **Step 5：创建 Deploy Hook**

Cloudflare 控制台：

```text
Pages 项目
→ Settings
→ Builds
→ Add deploy hook
```

配置：

```text
Name: sanity-content
Branch: 生产分支
```

复制 Hook URL。该 URL 等同部署触发凭据，不写入仓库。

- [ ] **Step 6：配置 Sanity Webhook**

在 Sanity Manage 创建 Webhook：

```text
Name: Cloudflare Pages production
URL: <Cloudflare Deploy Hook URL>
Dataset: production
Trigger on: create, update, delete
HTTP method: POST
```

过滤草稿：

```groq
!(_id in path("drafts.**"))
```

- [ ] **Step 7：验证自动部署**

在 Studio 修改并发布一条内容。

预期：

1. Cloudflare 出现 Deploy Hook 触发的部署。
2. 构建成功。
3. 新内容在 `pages.dev` 站点可见。
4. 只保存草稿不会触发生产内容变化。

- [ ] **Step 8：更新文档与知识快照**

记录：

- 前台构建环境变量。
- Studio 部署命令。
- Webhook 与 Deploy Hook 的职责。
- 内容发布故障排查。
- 图片已迁移到 Sanity CDN。
- 旧本地数据尚未删除。

- [ ] **Step 9：提交部署与知识文档**

```powershell
git add docs/deployment.md docs/image-strategy.md docs/project-knowledge.md
git commit -m "docs: 更新 Sanity 与 Cloudflare 部署流程"
```

## Task 12：最终验证与删除前检查

**Files:**
- No deletion in this task

- [ ] **Step 1：运行完整自动验证**

```powershell
npm run test
npm run build
Set-Location studio
npm run build
```

预期：全部成功。

- [ ] **Step 2：验证前台**

检查：

- `/`
- `/island/photos/`
- 相册年份和月份归档
- 相册加载更多 JSON
- `/island/notes/`
- 每个文章详情页
- `/island/projects/`
- `/island/about/`
- 英文路由

- [ ] **Step 3：验证构建失败保护**

在 Cloudflare Preview 环境中临时设置错误 dataset，触发预览构建。

预期：

- 预览构建失败。
- 生产部署不受影响。
- 日志明确指出 Sanity 查询失败。

随后恢复正确变量。

- [ ] **Step 4：确认仓库和构建产物没有原图**

```powershell
git status --short
Get-ChildItem -LiteralPath dist -Recurse -File |
  Where-Object { $_.Extension -in '.jpg', '.jpeg', '.png', '.webp', '.avif' }
```

预期：不存在从 Sanity 上传进入仓库或构建产物的相册原图。

- [ ] **Step 5：保留旧内容等待删除确认**

确认线上至少完成一次：

- 新增内容。
- 修改内容。
- 撤销发布或删除内容。
- Webhook 自动构建。

完成后另开任务请求用户确认，才允许删除：

```text
src/data/photos.ts
src/data/projects.ts
src/data/profile.ts
src/content/notes/*.md
src/content.config.ts
```

## 决策记录

- Sanity Studio 独立部署到 Sanity 托管域名，不和前台一起发布到 Cloudflare Pages。
- Cloudflare Pages 只部署仓库根目录的 Astro 前台。
- 前台构建不使用 Sanity Token，只读取公开数据集中的已发布内容。
- `useCdn: false` 确保 Webhook 触发构建时读取最新内容。
- `published` perspective 排除草稿和版本文档。
- 图片只保存于 Sanity，前台通过 CDN URL 引用。
- 迁移 Token 完成后立即撤销。
- 旧本地内容在首次上线验证完成前不删除。
- 由于现有四条相册数据没有真实图片，`photo.image` 在首次迁移期使用 Studio 警告而不是阻断校验；新照片发布前应上传图片。
