# 海风相册信息流与灯箱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将海风相册升级为支持数百张不同画幅照片的静态分页瀑布流，并加入时间归档、渐进加载和全屏灯箱。

**Architecture:** Astro 在构建阶段按日期、年份、月份和页码生成 HTML 与 JSON 静态路由，首批照片直接服务端渲染。React island 在客户端增强 CSS Grid 瀑布流、加载更多和灯箱；纯数据计算集中在无 DOM 依赖的工具模块中，使用 Node 内置测试框架覆盖。

**Tech Stack:** Astro 6、React 19、TypeScript、GSAP、`@gsap/react`、Node `node:test`、现有中文原文反查 i18n。

---

## 文件结构

### 新建

- `src/lib/photos.ts`：排序、归档、分页、路由和全景判定纯函数。
- `src/components/photos/PhotoArchivePage.astro`：相册归档页的服务端页面组合。
- `src/components/photos/PhotoArchiveFilter.astro`：年份、月份归档链接。
- `src/components/photos/PhotoGallery.tsx`：客户端增强入口、已加载批次和 URL 状态。
- `src/components/photos/PhotoCard.tsx`：照片比例占位、缩略图、元信息和失败状态。
- `src/components/photos/PhotoLightbox.tsx`：原图灯箱、键盘、焦点和相邻预加载。
- `src/components/photos/PhotoGallery.css`：相册专属布局、交互、响应式和减少动画。
- `src/pages/island/photos/[...archive].astro`：年份、月份及分页 HTML 静态路由。
- `src/pages/island/photos/data/[...archive].json.ts`：加载更多使用的静态 JSON。
- `tests/photos.test.ts`：照片纯函数单元测试。

### 修改

- `src/data/photos.ts`：补充唯一 ID、真实宽高和响应式缩略图结构。
- `src/pages/island/photos/index.astro`：改用统一的归档页面组件。
- `src/i18n/messages.ts`：补充相册筛选、加载和灯箱界面文案。
- `tests/i18n.test.ts`：覆盖新增相册界面文案反查。
- `package.json`：增加照片测试脚本并纳入总测试。
- `src/styles/island-pages.css`：移除旧相册卡片专属样式，只保留其他内容页共享样式。

### 暂不删除

- `src/components/island/PhotoCard.astro`

该文件在新相册页完成后不再使用，但项目规则要求删除前单独确认。本计划只停止引用，不执行删除。

---

### Task 1: 扩展照片数据模型与纯函数

**Files:**
- Modify: `src/data/photos.ts`
- Create: `src/lib/photos.ts`
- Create: `tests/photos.test.ts`
- Modify: `package.json`

- [ ] **Step 1: 写照片工具的失败测试**

在 `tests/photos.test.ts` 写入：

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPhotoArchivePages,
  getPhotoArchive,
  isPanoramaPhoto,
  sortPhotosByDate,
} from '../src/lib/photos.ts';

import type { PhotoItem } from '../src/data/photos.ts';

const makePhoto = (
  id: string,
  date: string,
  width = 6000,
  height = 4000,
): PhotoItem => ({
  id,
  title: id,
  alt: id,
  location: '测试地点',
  date,
  camera: '测试相机',
  lens: '测试镜头',
  width,
  height,
  thumbnail: '',
  original: '',
  color: 'teal',
});

test('sorts photos by shooting date descending without mutating input', () => {
  const input = [
    makePhoto('old', '2025-02-01'),
    makePhoto('new', '2026-05-01'),
  ];

  const result = sortPhotosByDate(input);

  assert.deepEqual(result.map(({ id }) => id), ['new', 'old']);
  assert.deepEqual(input.map(({ id }) => id), ['old', 'new']);
});

test('filters a year and month archive', () => {
  const input = [
    makePhoto('may', '2026-05-18'),
    makePhoto('april', '2026-04-08'),
    makePhoto('previous-year', '2025-05-01'),
  ];

  assert.deepEqual(
    getPhotoArchive(input, { year: 2026, month: 5 }).map(({ id }) => id),
    ['may'],
  );
});

test('builds stable 30-item static pages', () => {
  const input = Array.from(
    { length: 61 },
    (_, index) => makePhoto(`photo-${index}`, `2026-05-${String((index % 28) + 1).padStart(2, '0')}`),
  );

  const pages = buildPhotoArchivePages(input, 30);

  assert.equal(pages.length, 3);
  assert.equal(pages[0].photos.length, 30);
  assert.equal(pages[2].photos.length, 1);
  assert.equal(pages[1].page, 2);
  assert.equal(pages[1].totalPages, 3);
});

test('treats ratios at or above 2.4 as panoramas', () => {
  assert.equal(isPanoramaPhoto(makePhoto('wide', '2026-05-01', 12000, 5000)), true);
  assert.equal(isPanoramaPhoto(makePhoto('regular', '2026-05-01', 6000, 4000)), false);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/photos.test.ts
```

Expected: FAIL，错误为无法导入 `src/lib/photos.ts` 或缺少新的 `PhotoItem` 字段。

- [ ] **Step 3: 扩展照片数据**

在 `src/data/photos.ts` 将接口改为：

```ts
export interface PhotoSource {
  src: string;
  width: number;
  type?: 'image/avif' | 'image/webp';
}

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
  thumbnailSources?: PhotoSource[];
  original?: string;
  color: 'teal' | 'gold' | 'pink' | 'green';
}
```

为现有四条照片增加稳定 ID 和画幅：

```ts
id: 'evening-sea-breeze',
width: 6000,
height: 4000,

id: 'sunny-street-corner',
width: 4000,
height: 6000,

id: 'afternoon-plant-shadow',
width: 5184,
height: 3888,

id: 'pink-sunset',
width: 12000,
height: 4000,
```

- [ ] **Step 4: 实现纯函数和路由类型**

在 `src/lib/photos.ts` 定义：

```ts
import type { PhotoItem } from '../data/photos.ts';

export const PHOTO_PAGE_SIZE = 30;
export const PANORAMA_RATIO = 2.4;

export interface PhotoArchive {
  year?: number;
  month?: number;
}

export interface PhotoArchivePage {
  archive: PhotoArchive;
  page: number;
  totalPages: number;
  photos: PhotoItem[];
  href: string;
  dataHref: string;
  nextHref?: string;
  nextDataHref?: string;
}

export function sortPhotosByDate(items: readonly PhotoItem[]): PhotoItem[] {
  return [...items].sort((left, right) => right.date.localeCompare(left.date));
}

export function getPhotoArchive(
  items: readonly PhotoItem[],
  archive: PhotoArchive,
): PhotoItem[] {
  return sortPhotosByDate(items).filter((photo) => {
    const [year, month] = photo.date.split('-').map(Number);
    return (!archive.year || year === archive.year)
      && (!archive.month || month === archive.month);
  });
}

export function isPanoramaPhoto(photo: Pick<PhotoItem, 'width' | 'height'>): boolean {
  return photo.width / photo.height >= PANORAMA_RATIO;
}

export function getPhotoArchiveBaseHref(archive: PhotoArchive): string {
  if (archive.year && archive.month) {
    return `/island/photos/${archive.year}/${String(archive.month).padStart(2, '0')}/`;
  }
  if (archive.year) {
    return `/island/photos/${archive.year}/`;
  }
  return '/island/photos/';
}

export function getPhotoArchivePageHref(archive: PhotoArchive, page: number): string {
  const baseHref = getPhotoArchiveBaseHref(archive);
  return page === 1 ? baseHref : `${baseHref}page/${page}/`;
}

export function getPhotoArchiveDataHref(archive: PhotoArchive, page: number): string {
  const path = getPhotoArchivePageHref(archive, page)
    .replace('/island/photos/', '')
    .replace(/\/$/, '');
  return `/island/photos/data/${path || 'all'}.json`;
}

export function buildPhotoArchivePages(
  items: readonly PhotoItem[],
  pageSize = PHOTO_PAGE_SIZE,
  archive: PhotoArchive = {},
): PhotoArchivePage[] {
  const filtered = getPhotoArchive(items, archive);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const nextPage = page < totalPages ? page + 1 : undefined;

    return {
      archive,
      page,
      totalPages,
      photos: filtered.slice(index * pageSize, page * pageSize),
      href: getPhotoArchivePageHref(archive, page),
      dataHref: getPhotoArchiveDataHref(archive, page),
      ...(nextPage
        ? {
            nextHref: getPhotoArchivePageHref(archive, nextPage),
            nextDataHref: getPhotoArchiveDataHref(archive, nextPage),
          }
        : {}),
    };
  });
}
```

- [ ] **Step 5: 把照片测试加入 npm scripts**

修改 `package.json`：

```json
{
  "scripts": {
    "test:i18n": "node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/i18n.test.ts",
    "test:photos": "node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/photos.test.ts",
    "test": "npm run test:i18n && npm run test:photos"
  }
}
```

- [ ] **Step 6: 运行测试确认通过**

Run:

```powershell
npm run test:photos
```

Expected: 4 tests PASS。

- [ ] **Step 7: 提交**

```powershell
git add package.json src/data/photos.ts src/lib/photos.ts tests/photos.test.ts
git commit -m "feat(photos): 添加照片归档与分页工具"
```

---

### Task 2: 补充相册界面国际化

**Files:**
- Modify: `src/i18n/messages.ts`
- Modify: `tests/i18n.test.ts`

- [ ] **Step 1: 写新增界面文案反查的失败测试**

在 `tests/i18n.test.ts` 增加：

```ts
test('maps photo archive and lightbox interface text to semantic keys', () => {
  assert.equal(getMessageKey('全部照片'), 'photos.archive.all');
  assert.equal(getMessageKey('加载更多'), 'photos.loadMore');
  assert.equal(getMessageKey('上一张'), 'photos.lightbox.previous');
  assert.equal(getMessageKey('下一张'), 'photos.lightbox.next');
  assert.equal(getMessageKey('关闭大图'), 'photos.lightbox.close');
  assert.equal(getMessageKey('图片加载失败'), 'photos.imageError');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:i18n
```

Expected: FAIL，`getMessageKey('全部照片')` 返回 `undefined`。

- [ ] **Step 3: 增加语义 key 和中英文消息**

在 `sourceTextKeys` 增加：

```ts
'全部照片': 'photos.archive.all',
'加载更多': 'photos.loadMore',
'没有更多照片了': 'photos.end',
'上一张': 'photos.lightbox.previous',
'下一张': 'photos.lightbox.next',
'关闭大图': 'photos.lightbox.close',
'照片详情': 'photos.lightbox.details',
'图片加载中': 'photos.imageLoading',
'图片加载失败': 'photos.imageError',
'重试加载': 'photos.retry',
'当前照片': 'photos.currentPhoto',
'暂无照片': 'photos.empty',
'返回全部照片': 'photos.backToAll',
```

在 `messages['zh-CN']` 使用相同中文，在 `messages.en` 增加：

```ts
'photos.archive.all': 'All Photos',
'photos.loadMore': 'Load More',
'photos.end': 'No More Photos',
'photos.lightbox.previous': 'Previous Photo',
'photos.lightbox.next': 'Next Photo',
'photos.lightbox.close': 'Close Preview',
'photos.lightbox.details': 'Photo Details',
'photos.imageLoading': 'Loading Image',
'photos.imageError': 'Image Failed to Load',
'photos.retry': 'Retry',
'photos.currentPhoto': 'Current Photo',
'photos.empty': 'No Photos Yet',
'photos.backToAll': 'Back to All Photos',
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```powershell
npm run test:i18n
```

Expected: 所有 i18n 测试 PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/i18n/messages.ts tests/i18n.test.ts
git commit -m "feat(i18n): 添加相册归档与灯箱文案"
```

---

### Task 3: 生成静态归档、分页和 JSON 路由

**Files:**
- Create: `src/components/photos/PhotoArchivePage.astro`
- Create: `src/components/photos/PhotoArchiveFilter.astro`
- Modify: `src/pages/island/photos/index.astro`
- Create: `src/pages/island/photos/[...archive].astro`
- Create: `src/pages/island/photos/data/[...archive].json.ts`
- Modify: `tests/photos.test.ts`

- [ ] **Step 1: 增加归档清单和路径解析失败测试**

先在 `src/lib/photos.ts` 计划新增以下导出，并在测试中引用：

```ts
import {
  buildAllPhotoArchivePages,
  parsePhotoArchivePath,
} from '../src/lib/photos.ts';

test('builds all, year, and month archive pages', () => {
  const input = [
    makePhoto('may', '2026-05-18'),
    makePhoto('april', '2026-04-08'),
    makePhoto('previous-year', '2025-05-01'),
  ];

  const pages = buildAllPhotoArchivePages(input, 30);
  const hrefs = pages.map(({ href }) => href);

  assert.ok(hrefs.includes('/island/photos/'));
  assert.ok(hrefs.includes('/island/photos/2026/'));
  assert.ok(hrefs.includes('/island/photos/2026/05/'));
  assert.ok(hrefs.includes('/island/photos/2025/05/'));
});

test('parses archive paths and rejects unsupported shapes', () => {
  assert.deepEqual(parsePhotoArchivePath('2026/05/page/2'), {
    archive: { year: 2026, month: 5 },
    page: 2,
  });
  assert.equal(parsePhotoArchivePath('2026/13'), undefined);
  assert.equal(parsePhotoArchivePath('unexpected/path/value'), undefined);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:photos
```

Expected: FAIL，缺少 `buildAllPhotoArchivePages` 和 `parsePhotoArchivePath`。

- [ ] **Step 3: 实现归档枚举和路径解析**

在 `src/lib/photos.ts` 增加：

```ts
export function getPhotoArchiveOptions(items: readonly PhotoItem[]) {
  const years = new Map<number, Set<number>>();

  sortPhotosByDate(items).forEach(({ date }) => {
    const [year, month] = date.split('-').map(Number);
    const months = years.get(year) ?? new Set<number>();
    months.add(month);
    years.set(year, months);
  });

  return [...years.entries()]
    .sort(([left], [right]) => right - left)
    .map(([year, months]) => ({
      year,
      months: [...months].sort((left, right) => right - left),
    }));
}

export function buildAllPhotoArchivePages(
  items: readonly PhotoItem[],
  pageSize = PHOTO_PAGE_SIZE,
): PhotoArchivePage[] {
  const archiveOptions = getPhotoArchiveOptions(items);
  const archives: PhotoArchive[] = [
    {},
    ...archiveOptions.flatMap(({ year, months }) => [
      { year },
      ...months.map((month) => ({ year, month })),
    ]),
  ];

  return archives.flatMap((archive) => buildPhotoArchivePages(items, pageSize, archive));
}

export function parsePhotoArchivePath(path: string) {
  const parts = path.split('/').filter(Boolean);
  const pageIndex = parts.indexOf('page');
  const page = pageIndex >= 0 ? Number(parts[pageIndex + 1]) : 1;
  const archiveParts = pageIndex >= 0 ? parts.slice(0, pageIndex) : parts;

  if (!Number.isInteger(page) || page < 1 || archiveParts.length > 2) {
    return undefined;
  }

  const year = archiveParts[0] ? Number(archiveParts[0]) : undefined;
  const month = archiveParts[1] ? Number(archiveParts[1]) : undefined;

  if ((year && !Number.isInteger(year)) || (month && (month < 1 || month > 12))) {
    return undefined;
  }

  return {
    archive: {
      ...(year ? { year } : {}),
      ...(month ? { month } : {}),
    },
    page,
  };
}
```

- [ ] **Step 4: 创建归档筛选组件**

`PhotoArchiveFilter.astro` 接收：

```ts
interface Props {
  locale: string;
  current: PhotoArchive;
  options: ReturnType<typeof getPhotoArchiveOptions>;
}
```

渲染规则：

- “全部照片”链接到 `/island/photos/`。
- 年份链接到 `/island/photos/{year}/`。
- 当前年份下渲染月份链接 `/island/photos/{year}/{month}/`。
- 当前项使用 `aria-current="page"`。
- 所有中文界面文本使用 `t(locale, '中文原文')`。

- [ ] **Step 5: 创建统一服务端页面组件**

`PhotoArchivePage.astro` 接收：

```ts
interface Props {
  locale: string;
  pageData: PhotoArchivePage;
  archiveOptions: ReturnType<typeof getPhotoArchiveOptions>;
}
```

组件负责：

- 使用 `PageShell` 输出标题、说明和压缩后的 hero。
- 渲染 `PhotoArchiveFilter`。
- 本任务先复用现有 `PhotoCard.astro` 服务端渲染 `pageData.photos`，保证静态路由提交可独立构建。
- 使用普通 `<a href={pageData.nextHref}>` 输出下一页链接。
- 空归档时渲染“暂无照片”和“返回全部照片”链接。

临时主体结构：

```astro
<section class="island-content-page__grid island-content-page__grid--photos">
  {pageData.photos.map((photo) => <PhotoCard locale={locale} photo={photo} />)}
</section>

{pageData.nextHref && (
  <a class="island-action" href={pageData.nextHref}>
    {t(locale, '加载更多')}
  </a>
)}
```

- [ ] **Step 6: 改造根相册页**

`src/pages/island/photos/index.astro`：

```astro
---
import PhotoArchivePage from '../../../components/photos/PhotoArchivePage.astro';
import { photos } from '../../../data/photos';
import { buildPhotoArchivePages, getPhotoArchiveOptions } from '../../../lib/photos';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { defaultLocale, t } from '../../../i18n';

const locale = Astro.currentLocale ?? defaultLocale;
const pageData = buildPhotoArchivePages(photos)[0];
const archiveOptions = getPhotoArchiveOptions(photos);
---

<BaseLayout
  locale={locale}
  title={`${t(locale, '海风相册')} | ${t(locale, 'Island Home')}`}
  description={t(locale, '摄影作品先以轻量缩略图和拍摄信息展示，后续再接入大图预览。')}
>
  <PhotoArchivePage locale={locale} pageData={pageData} archiveOptions={archiveOptions} />
</BaseLayout>
```

- [ ] **Step 7: 创建其余 HTML 静态路由**

`src/pages/island/photos/[...archive].astro`：

```astro
---
import PhotoArchivePage from '../../../components/photos/PhotoArchivePage.astro';
import { photos } from '../../../data/photos';
import { buildAllPhotoArchivePages, getPhotoArchiveOptions } from '../../../lib/photos';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { defaultLocale, t } from '../../../i18n';

export function getStaticPaths() {
  return buildAllPhotoArchivePages(photos)
    .filter(({ href }) => href !== '/island/photos/')
    .map((pageData) => ({
      params: {
        archive: pageData.href
          .replace('/island/photos/', '')
          .replace(/\/$/, ''),
      },
      props: { pageData },
    }));
}

const { pageData } = Astro.props;
const locale = Astro.currentLocale ?? defaultLocale;
const archiveOptions = getPhotoArchiveOptions(photos);
---

<BaseLayout
  locale={locale}
  title={`${t(locale, '海风相册')} | ${t(locale, 'Island Home')}`}
  description={t(locale, '摄影作品先以轻量缩略图和拍摄信息展示，后续再接入大图预览。')}
>
  <PhotoArchivePage locale={locale} pageData={pageData} archiveOptions={archiveOptions} />
</BaseLayout>
```

- [ ] **Step 8: 创建 JSON 静态端点**

`src/pages/island/photos/data/[...archive].json.ts`：

```ts
import { photos } from '../../../../data/photos.ts';
import { buildAllPhotoArchivePages } from '../../../../lib/photos.ts';

import type { APIRoute } from 'astro';

export function getStaticPaths() {
  return buildAllPhotoArchivePages(photos).map((pageData) => ({
    params: {
      archive: pageData.dataHref
        .replace('/island/photos/data/', '')
        .replace(/\.json$/, ''),
    },
    props: { pageData },
  }));
}

export const GET: APIRoute = ({ props }) => new Response(
  JSON.stringify(props.pageData),
  {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  },
);
```

- [ ] **Step 9: 运行测试与构建**

Run:

```powershell
npm run test:photos
npm run build
```

Expected:

- 照片测试全部 PASS。
- 构建生成 `/island/photos/2026/`、月份路由和对应 JSON。

- [ ] **Step 10: 提交**

```powershell
git add src/components/photos/PhotoArchivePage.astro src/components/photos/PhotoArchiveFilter.astro src/pages/island/photos src/lib/photos.ts tests/photos.test.ts
git commit -m "feat(photos): 生成相册归档与静态分页"
```

---

### Task 4: 实现服务端可见的瀑布流和照片卡片

**Files:**
- Create: `src/components/photos/PhotoGallery.tsx`
- Create: `src/components/photos/PhotoCard.tsx`
- Create: `src/components/photos/PhotoGallery.css`
- Modify: `src/components/photos/PhotoArchivePage.astro`
- Modify: `src/styles/island-pages.css`

- [ ] **Step 1: 创建共享 React 类型**

在 `PhotoGallery.tsx` 导出：

```ts
export interface PhotoGalleryLabels {
  location: string;
  date: string;
  camera: string;
  lens: string;
  loadMore: string;
  end: string;
  viewOriginal: string;
  imageLoading: string;
  imageError: string;
  retry: string;
  previous: string;
  next: string;
  close: string;
  details: string;
  currentPhoto: string;
}

export interface PhotoGalleryProps {
  initialPhotos: PhotoItem[];
  page: number;
  totalPages: number;
  nextHref?: string;
  nextDataHref?: string;
  labels: PhotoGalleryLabels;
}
```

完成类型和组件骨架后，在 `PhotoArchivePage.astro` 中用：

```astro
<PhotoGallery
  initialPhotos={pageData.photos}
  page={pageData.page}
  totalPages={pageData.totalPages}
  nextHref={pageData.nextHref}
  nextDataHref={pageData.nextDataHref}
  labels={labels}
  client:load
/>
```

替换 Task 3 的临时 `PhotoCard.astro` 网格和下一页链接。React 的服务端输出仍包含首批卡片，`client:load` 只负责 hydration。

- [ ] **Step 2: 实现照片卡片**

`PhotoCard.tsx` 必须：

- 使用 `<button type="button">` 作为灯箱触发器。
- 通过 `style={{ aspectRatio: `${photo.width} / ${photo.height}` }}` 保留比例。
- 有 `thumbnail` 时使用 `<picture>`、`thumbnailSources` 和 `img loading="lazy" decoding="async"`。
- 无缩略图或加载失败时展示颜色占位图。
- 默认显示标题和日期。
- 元信息层显示地点、相机、镜头和查看大图提示。
- `onLoad` 和 `onError` 通知瀑布流重新测量。

核心接口：

```ts
interface PhotoCardProps {
  photo: PhotoItem;
  labels: PhotoGalleryLabels;
  onOpen: () => void;
  onMeasure: () => void;
}
```

- [ ] **Step 3: 实现保持 DOM 顺序的瀑布流测量**

在 `PhotoGallery.tsx`：

```ts
const gridRef = useRef<HTMLDivElement>(null);

const measureCards = useCallback(() => {
  const grid = gridRef.current;
  if (!grid) return;

  const rowHeight = Number.parseFloat(getComputedStyle(grid).gridAutoRows);
  const rowGap = Number.parseFloat(getComputedStyle(grid).rowGap);

  grid.querySelectorAll<HTMLElement>('[data-photo-card]').forEach((card) => {
    const span = Math.ceil(
      (card.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap),
    );
    card.style.gridRowEnd = `span ${span}`;
  });
}, []);
```

在 effect 中使用 `ResizeObserver` 观察容器，初始化和照片加载后调用 `measureCards`。清理时断开 observer。

- [ ] **Step 4: 增加全景跨列**

`PhotoCard` 根元素增加：

```tsx
data-photo-card
data-panorama={isPanoramaPhoto(photo) ? 'true' : undefined}
```

CSS：

```css
.photo-gallery__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 8px;
  gap: 18px;
}

.photo-card[data-panorama='true'] {
  grid-column: span 2;
}

@media (max-width: 920px) {
  .photo-gallery__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .photo-gallery__grid {
    grid-template-columns: 1fr;
  }

  .photo-card[data-panorama='true'] {
    grid-column: auto;
  }
}
```

无 JavaScript 时由 SSR 输出普通网格；hydrate 后添加 `photo-gallery--enhanced` 类启用行跨度。

- [ ] **Step 5: 实现卡片渐进信息层**

CSS 规则：

- 图片容器 `overflow: hidden`。
- 悬停和 `:focus-visible` 时图片最大缩放到 `1.025`。
- 元信息层使用半透明浅色背景，从底部 `translateY(10px)` 渐入。
- 触屏设备默认只显示标题与日期，完整信息进入灯箱后查看。
- 所有焦点状态使用 3px 绿色轮廓。
- 卡片边框半径不超过 8px，适应摄影内容展示。

- [ ] **Step 6: 清理旧相册专属共享 CSS**

从 `src/styles/island-pages.css` 移除：

- `.island-content-page__grid--photos`
- `.island-card--photo`
- `.island-photo-card__quick`
- `.island-photo-card__summary`
- `.island-photo-card__details`

不要删除项目、文章和关于页仍使用的 `.island-card` 共享样式。

- [ ] **Step 7: 构建确认首屏 SSR**

Run:

```powershell
npm run build
Select-String -LiteralPath 'dist/island/photos/index.html' -Pattern 'data-photo-card'
```

Expected:

- 构建成功。
- 静态 HTML 中可以找到首批照片卡片，不是空的 React 容器。

- [ ] **Step 8: 提交**

```powershell
git add src/components/photos src/styles/island-pages.css
git commit -m "feat(photos): 实现响应式照片瀑布流"
```

---

### Task 5: 实现加载更多和历史 URL

**Files:**
- Modify: `src/components/photos/PhotoGallery.tsx`
- Modify: `src/components/photos/PhotoGallery.css`
- Modify: `tests/photos.test.ts`

- [ ] **Step 1: 增加照片去重测试**

在 `src/lib/photos.ts` 计划新增 `mergeUniquePhotos`，测试：

```ts
import { mergeUniquePhotos } from '../src/lib/photos.ts';

test('merges loaded pages without duplicate photo ids', () => {
  const existing = [makePhoto('one', '2026-05-18')];
  const incoming = [
    makePhoto('one', '2026-05-18'),
    makePhoto('two', '2026-05-17'),
  ];

  assert.deepEqual(
    mergeUniquePhotos(existing, incoming).map(({ id }) => id),
    ['one', 'two'],
  );
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:photos
```

Expected: FAIL，缺少 `mergeUniquePhotos`。

- [ ] **Step 3: 实现去重**

```ts
export function mergeUniquePhotos(
  existing: readonly PhotoItem[],
  incoming: readonly PhotoItem[],
): PhotoItem[] {
  const seen = new Set(existing.map(({ id }) => id));
  return [
    ...existing,
    ...incoming.filter(({ id }) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }),
  ];
}
```

- [ ] **Step 4: 实现加载更多状态**

`PhotoGallery.tsx` 增加：

```ts
const [loadedPhotos, setLoadedPhotos] = useState(initialPhotos);
const [nextPageHref, setNextPageHref] = useState(nextHref);
const [nextPageDataHref, setNextPageDataHref] = useState(nextDataHref);
const [isLoading, setIsLoading] = useState(false);
const [loadError, setLoadError] = useState(false);
```

点击下一页链接时：

1. `preventDefault()`。
2. 请求 `nextPageDataHref`。
3. 校验 `response.ok`。
4. 使用 `mergeUniquePhotos` 追加。
5. 更新下一页 HTML/JSON URL。
6. `history.pushState({ photoPage: payload.page }, '', payload.href)`。
7. 动画仅作用于本次新增卡片。
8. 失败时保留原 `<a href={nextPageHref}>`，显示重试文案。

- [ ] **Step 5: 处理浏览器返回**

监听 `popstate`：

- 当前 URL 指向已加载分页时，不删除已有照片，只滚动到对应批次起点。
- 当前 URL 指向尚未加载的归档或更前页时，允许浏览器执行正常页面导航。
- 每批根节点增加 `data-page={page}`，用于定位。

- [ ] **Step 6: 运行测试与构建**

Run:

```powershell
npm run test:photos
npm run build
```

Expected: 全部 PASS，构建成功。

- [ ] **Step 7: 提交**

```powershell
git add src/components/photos/PhotoGallery.tsx src/components/photos/PhotoGallery.css src/lib/photos.ts tests/photos.test.ts
git commit -m "feat(photos): 添加分页加载与历史状态"
```

---

### Task 6: 实现全屏灯箱

**Files:**
- Create: `src/components/photos/PhotoLightbox.tsx`
- Modify: `src/components/photos/PhotoGallery.tsx`
- Modify: `src/components/photos/PhotoGallery.css`
- Modify: `src/lib/photos.ts`
- Modify: `tests/photos.test.ts`

- [ ] **Step 1: 写灯箱索引失败测试**

在 `tests/photos.test.ts`：

```ts
import { getAdjacentPhotoIndex } from '../src/lib/photos.ts';

test('calculates bounded lightbox indexes', () => {
  assert.equal(getAdjacentPhotoIndex(0, -1, 4), undefined);
  assert.equal(getAdjacentPhotoIndex(0, 1, 4), 1);
  assert.equal(getAdjacentPhotoIndex(3, 1, 4), undefined);
  assert.equal(getAdjacentPhotoIndex(3, -1, 4), 2);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:photos
```

Expected: FAIL，缺少 `getAdjacentPhotoIndex`。

- [ ] **Step 3: 实现索引函数**

```ts
export function getAdjacentPhotoIndex(
  current: number,
  direction: -1 | 1,
  length: number,
): number | undefined {
  const next = current + direction;
  return next >= 0 && next < length ? next : undefined;
}
```

- [ ] **Step 4: 使用原生 dialog 实现灯箱**

`PhotoLightbox.tsx` 使用 `<dialog>`，props：

```ts
interface PhotoLightboxProps {
  photos: PhotoItem[];
  currentIndex: number | null;
  labels: PhotoGalleryLabels;
  hasNextPage: boolean;
  onClose: () => void;
  onChange: (index: number) => void;
  onRequestNextPage: () => Promise<boolean>;
}
```

行为：

- `currentIndex !== null` 时调用 `dialog.showModal()`。
- `cancel` 事件关闭。
- `ArrowLeft`、`ArrowRight`、`Escape` 通过 document keydown 处理并清理。
- 打开时记录 `document.activeElement`，关闭后恢复焦点。
- 打开时设置 `document.documentElement.style.overflow = 'hidden'`，清理时恢复旧值。
- 使用 `aria-labelledby` 和 `aria-describedby`。
- 上一张、下一张、关闭使用图标按钮，并有国际化 `aria-label`。
- 到已加载最后一张且仍有下一页时，先等待 `onRequestNextPage()`，成功后切到追加后的下一张。

- [ ] **Step 5: 实现原图加载和相邻预加载**

灯箱内部：

```ts
const source = photo.original || photo.thumbnail;
```

- 无 source 时显示比例一致的颜色占位图。
- source 变化时进入 loading。
- `onLoad` 转为 ready，`onError` 转为 error。
- ready 后通过 `new Image().src = adjacent.original` 预加载前后相邻原图。
- 失败状态仍保留导航与关闭。

- [ ] **Step 6: 实现横竖片稳定画布**

灯箱媒体区：

```css
.photo-lightbox__stage {
  width: min(88vw, 1400px);
  height: min(78dvh, 900px);
  display: grid;
  place-items: center;
}

.photo-lightbox__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
```

元信息放在独立底部栏，不参与图片画布尺寸计算。

- [ ] **Step 7: 集成卡片打开和关闭**

`PhotoGallery` 保存：

```ts
const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
const currentIndex = activePhotoId
  ? loadedPhotos.findIndex(({ id }) => id === activePhotoId)
  : null;
```

关闭时设置 `null`。卡片 `onOpen` 设置对应 ID。

- [ ] **Step 8: 运行测试与构建**

Run:

```powershell
npm run test
npm run build
```

Expected: 全部测试 PASS，7 个以上静态页面构建成功。

- [ ] **Step 9: 提交**

```powershell
git add src/components/photos src/lib/photos.ts tests/photos.test.ts
git commit -m "feat(photos): 添加可访问的大图灯箱"
```

---

### Task 7: 增加 GSAP 入场动效与无障碍降级

**Files:**
- Modify: `src/components/photos/PhotoGallery.tsx`
- Modify: `src/components/photos/PhotoGallery.css`

- [ ] **Step 1: 在组件作用域注册 GSAP**

```ts
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

gsap.registerPlugin(useGSAP);
```

使用 `scopeRef` 限制选择器范围，不修改全局 `pageMotion.ts`。

- [ ] **Step 2: 实现首次进入动画**

```ts
useGSAP(() => {
  const media = gsap.matchMedia();

  media.add(
    { reduceMotion: '(prefers-reduced-motion: reduce)' },
    ({ conditions }) => {
      if (conditions?.reduceMotion) {
        gsap.set('[data-photo-card]', { autoAlpha: 1, clearProps: 'transform' });
        return;
      }

      gsap.from('[data-photo-card]', {
        y: 22,
        autoAlpha: 0,
        duration: 0.52,
        stagger: 0.05,
        ease: 'power3.out',
        clearProps: 'transform',
      });
    },
  );

  return () => media.revert();
}, { scope: scopeRef });
```

- [ ] **Step 3: 动画新增批次**

加载成功后只对 `[data-page="${payload.page}"] [data-photo-card]` 执行同类动画。调用前先等待 React 完成 DOM 更新，可用 `requestAnimationFrame`；清理未完成的 frame。

- [ ] **Step 4: 增加减少动画和触屏规则**

CSS：

- `prefers-reduced-motion` 下取消卡片、信息层和灯箱位移/缩放 transition。
- `(hover: none)` 下不显示依赖 hover 的完整元信息层。
- 灯箱按钮触控区域至少 44px。
- 归档链接在移动端横向滚动，并通过 `scrollbar-width: none` 隐藏滚动条但保留滚动能力。

- [ ] **Step 5: 运行构建**

Run:

```powershell
npm run build
```

Expected: 构建成功，无 `jsxDEV is not a function`。

- [ ] **Step 6: 提交**

```powershell
git add src/components/photos/PhotoGallery.tsx src/components/photos/PhotoGallery.css
git commit -m "feat(photos): 添加照片流与灯箱动效"
```

---

### Task 8: 完整验证与项目知识快照

**Files:**
- Modify: `README.md`
- Create: `docs/project-knowledge/photos-gallery.md`

- [ ] **Step 1: 更新 README**

增加相册能力说明：

- 原始比例瀑布流。
- 年份和月份静态归档。
- 30 张一页的渐进加载。
- 原图按需灯箱加载。
- 照片数据必须提供 `id`、`width`、`height`。

- [ ] **Step 2: 写项目知识快照**

`docs/project-knowledge/photos-gallery.md` 记录：

- 相册 HTML 和 JSON 路由格式。
- `PhotoItem` 字段约束。
- 构建期归档工具职责。
- React island 渐进增强边界。
- 新增照片时的操作步骤。
- 不要将个人照片标题和拍摄内容纳入强制英文翻译。

- [ ] **Step 3: 运行完整自动验证**

Run:

```powershell
npm run test
npm run build
git diff --check
```

Expected:

- i18n 与照片测试全部 PASS。
- Astro 构建成功。
- 无空白错误、冲突标记或尾随空格错误。

- [ ] **Step 4: 检查构建路由**

Run:

```powershell
Get-ChildItem -LiteralPath 'dist/island/photos' -Recurse -File |
  Select-Object FullName
```

Expected: 包含根页、年份页、月份页、分页页及 JSON 文件。

- [ ] **Step 5: 浏览器验收**

启动：

```powershell
npm run dev -- --host 127.0.0.1 --port 4321
```

验收：

1. 1440px 桌面端横片、竖片、方片和全景图均完整显示。
2. 375px 移动端单列，无横向滚动。
3. 归档链接可刷新、分享和返回。
4. 加载更多追加下一页且 URL 更新。
5. 卡片悬停只渐进显示信息，不遮挡标题。
6. 灯箱支持鼠标、触摸、方向键和 `Esc`。
7. 灯箱关闭后焦点回到原卡片。
8. 缩略图和原图失败时布局不坍塌。
9. 减少动画模式下无位移和缩放动画。
10. 控制台无 React、GSAP、hydration 或资源加载错误。

- [ ] **Step 6: 提交文档**

```powershell
git add README.md docs/project-knowledge/photos-gallery.md
git commit -m "docs(photos): 补充相册维护与架构说明"
```

- [ ] **Step 7: 最终状态检查**

```powershell
git status --short
git log -8 --oneline
```

Expected:

- 仅保留用户原有或明确不属于本计划的未提交改动。
- 本计划产生的提交均使用中文 Conventional Commits。
