# Code Review Page Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复关键页面代码审查中确认的交互状态问题，并降低相册分页、导航高亮和首次加载组件的回归风险。

**Architecture:** 优先采用项目现有的 Astro + React island + Node Test Runner 模式，不引入新的测试框架或运行时依赖。把可纯函数化的路由判断抽到 `src/lib/navigation.ts`，把 React 组件内部状态修复限制在对应组件内，避免重构页面结构。相册 JS 增量加载采用“保留当前归档 URL”的策略，分页 URL 继续作为无 JS 和直接访问入口。

**Tech Stack:** Astro 6、React 19、TypeScript、GSAP、Node Test Runner、animal-island-ui

---

## File Structure

- `src/components/photos/PhotoLightbox.tsx`  
  负责相册大图弹窗、键盘切换、焦点返回和滚动锁定。需要拆分弹窗 open/close 与页面滚动锁定 effect。

- `tests/photo-lightbox.test.ts`  
  新增源码级回归测试，锁定 Lightbox 滚动锁定 effect 不再依赖具体 `photo` 对象变化。

- `src/lib/navigation.ts`  
  新增导航路径工具，集中处理路径归一化和父栏目 active 判断。

- `src/components/site/SiteHeader.astro`  
  使用导航工具判断 active 状态，确保相册年份页、月份页和文章详情页高亮父栏目。

- `tests/navigation.test.ts`  
  新增纯函数测试，覆盖首页精确匹配、父栏目匹配和相邻路径误匹配。

- `src/components/photos/PhotoGallery.tsx`  
  增加加载更多同步锁，移除 JS 增量加载时的 `pushState`/`popstate` 状态耦合。

- `tests/photos.test.ts`  
  扩展相册测试，覆盖加载锁源码约束和“不在 JS 增量加载中 push 分页 URL”的策略。

- `src/components/site/InitialLoadingOverlay.tsx`  
  低优先级清理：把 sessionStorage 已看过判断提前到动态 import 之前，避免已无需展示时仍加载 UI 组件。

- `tests/initial-loading.test.ts`  
  扩展首次 loading 测试，约束已看过时先判断 session，再动态加载 `Loading`。

- `package.json`  
  如新增单独测试文件，补充 `test:lightbox`、`test:navigation`，并纳入 `npm test`。

---

### Task 1: 修复 PhotoLightbox 切换照片后的滚动锁定

**Files:**
- Create: `tests/photo-lightbox.test.ts`
- Modify: `src/components/photos/PhotoLightbox.tsx`
- Modify: `package.json`

- [ ] **Step 1: 写失败测试**

新增 `tests/photo-lightbox.test.ts`：

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const lightboxSource = readFileSync(
  new URL('../src/components/photos/PhotoLightbox.tsx', import.meta.url),
  'utf8',
);

test('keeps page scroll locked while switching photos in the lightbox', () => {
  assert.match(lightboxSource, /const isOpen = Boolean\(photo\);/);
  assert.match(lightboxSource, /document\.documentElement\.style\.overflow = 'hidden';/);
  assert.match(lightboxSource, /}, \[isOpen\]\);/);
  assert.doesNotMatch(
    lightboxSource,
    /document\.documentElement\.style\.overflow = 'hidden';[\s\S]*?}, \[photo\]\);/,
  );
});
```

更新 `package.json` scripts：

```json
"test:lightbox": "node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/photo-lightbox.test.ts",
"test": "npm run test:i18n && npm run test:photos && npm run test:content && npm run test:migration && npm run test:motion && npm run test:loading && npm run test:home && npm run test:lightbox"
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:lightbox
```

Expected: FAIL，因为 `PhotoLightbox.tsx` 还没有 `const isOpen = Boolean(photo);`，滚动锁定仍在依赖 `[photo]` 的 effect 中。

- [ ] **Step 3: 最小实现**

在 `src/components/photos/PhotoLightbox.tsx` 中添加打开状态，并拆分 effect：

```tsx
const isOpen = Boolean(photo);

useEffect(() => {
  const dialog = dialogRef.current;
  if (!dialog) {
    return undefined;
  }

  if (photo && !dialog.open) {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    dialog.showModal();
  }

  if (!photo && dialog.open) {
    dialog.close();
  }

  return undefined;
}, [photo]);

useEffect(() => {
  if (!isOpen) {
    return undefined;
  }

  const previousOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  return () => {
    document.documentElement.style.overflow = previousOverflow;
  };
}, [isOpen]);
```

保留 `close()`、`goPrevious()`、`goNext()` 的现有行为，不改变弹窗 UI。

- [ ] **Step 4: 验证**

Run:

```powershell
npm run test:lightbox
npm run test:photos
```

Expected: 两个命令均 PASS。

- [ ] **Step 5: 提交建议**

```powershell
git add src/components/photos/PhotoLightbox.tsx tests/photo-lightbox.test.ts package.json
git commit -m "fix: 修复相册弹窗切换时的滚动锁定"
```

---

### Task 2: 修复子页面导航父栏目高亮

**Files:**
- Create: `src/lib/navigation.ts`
- Create: `tests/navigation.test.ts`
- Modify: `src/components/site/SiteHeader.astro`
- Modify: `package.json`

- [ ] **Step 1: 写失败测试**

新增 `tests/navigation.test.ts`：

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isNavigationItemActive,
  normalizePath,
} from '../src/lib/navigation.ts';

test('normalizes paths with trailing slash', () => {
  assert.equal(normalizePath('/island/photos'), '/island/photos/');
  assert.equal(normalizePath('/island/photos/'), '/island/photos/');
});

test('keeps the home navigation item exact', () => {
  assert.equal(isNavigationItemActive('/', '/'), true);
  assert.equal(isNavigationItemActive('/', '/island/photos/'), false);
});

test('marks descendant routes active for island sections', () => {
  assert.equal(isNavigationItemActive('/island/photos/', '/island/photos/2026/'), true);
  assert.equal(isNavigationItemActive('/island/photos/', '/island/photos/2026/05/'), true);
  assert.equal(isNavigationItemActive('/island/notes/', '/island/notes/photo-workflow/'), true);
});

test('does not mark sibling routes active', () => {
  assert.equal(isNavigationItemActive('/island/photos/', '/island/projects/'), false);
  assert.equal(isNavigationItemActive('/island/project/', '/island/projects/'), false);
});
```

更新 `package.json` scripts：

```json
"test:navigation": "node --disable-warning=ExperimentalWarning --experimental-strip-types --test tests/navigation.test.ts",
"test": "npm run test:i18n && npm run test:photos && npm run test:content && npm run test:migration && npm run test:motion && npm run test:loading && npm run test:home && npm run test:lightbox && npm run test:navigation"
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:navigation
```

Expected: FAIL，因为 `src/lib/navigation.ts` 尚不存在。

- [ ] **Step 3: 实现导航工具**

新增 `src/lib/navigation.ts`：

```ts
export const normalizePath = (path: string) => (
  path.endsWith('/') ? path : `${path}/`
);

export function isNavigationItemActive(
  itemHref: string,
  currentPath: string,
): boolean {
  const normalizedItemHref = normalizePath(itemHref);
  const normalizedCurrentPath = normalizePath(currentPath);

  if (normalizedItemHref === '/') {
    return normalizedCurrentPath === '/';
  }

  return normalizedCurrentPath === normalizedItemHref
    || normalizedCurrentPath.startsWith(normalizedItemHref);
}
```

- [ ] **Step 4: 接入 SiteHeader**

修改 `src/components/site/SiteHeader.astro`：

```astro
---
import { islandNavigationItems } from '../../data/islandNavigation';
import { t } from '../../i18n';
import { isNavigationItemActive } from '../../lib/navigation';

interface Props {
  locale: string;
  currentPath: string;
}

const { locale, currentPath } = Astro.props;
---
```

替换 map 内 active 判断：

```astro
const isActive = isNavigationItemActive(item.href, currentPath);
```

删除组件内原有 `normalizePath` 和 `normalizedCurrentPath`。

- [ ] **Step 5: 验证**

Run:

```powershell
npm run test:navigation
npm run test:motion
```

Expected: 两个命令均 PASS。

- [ ] **Step 6: 提交建议**

```powershell
git add src/lib/navigation.ts src/components/site/SiteHeader.astro tests/navigation.test.ts package.json
git commit -m "fix: 修复子页面导航父栏目高亮"
```

---

### Task 3: 给相册加载更多增加同步锁

**Files:**
- Modify: `src/components/photos/PhotoGallery.tsx`
- Modify: `tests/photos.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/photos.test.ts` 末尾添加：

```ts
test('guards photo load-more requests with a synchronous ref lock', () => {
  const source = readFileSync(
    new URL('../src/components/photos/PhotoGallery.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /const loadingRef = useRef\(false\);/);
  assert.match(source, /if \(!nextPageDataHref \|\| loadingRef\.current\)/);
  assert.match(source, /loadingRef\.current = true;/);
  assert.match(source, /loadingRef\.current = false;/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:photos
```

Expected: FAIL，因为 `PhotoGallery.tsx` 仍只用 `isLoading` state 做并发判断。

- [ ] **Step 3: 最小实现**

在 `src/components/photos/PhotoGallery.tsx` 的 state 区域加入：

```tsx
const loadingRef = useRef(false);
```

修改 `loadNextPage`：

```tsx
const loadNextPage = useCallback(async (): Promise<PhotoItem[]> => {
  if (!nextPageDataHref || loadingRef.current) {
    return [];
  }

  loadingRef.current = true;
  setIsLoading(true);
  setLoadError(false);

  try {
    const response = await fetch(nextPageDataHref);
    if (!response.ok) {
      throw new Error(`Photo page request failed: ${response.status}`);
    }

    const payload = await response.json() as PhotoArchivePage;
    const merged = mergeUniquePhotos(photos, payload.photos);
    const added = merged.slice(photos.length);

    setBatches((current) => (
      added.length > 0
        ? [...current, { page: payload.page, photos: added }]
        : current
    ));
    setNextPageHref(payload.nextHref);
    setNextPageDataHref(payload.nextDataHref);

    requestAnimationFrame(() => {
      measureCards();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.from(`[data-photo-batch="${payload.page}"] [data-photo-card]`, {
          y: 20,
          autoAlpha: 0,
          duration: 0.48,
          stagger: 0.04,
          ease: 'power3.out',
          clearProps: 'transform',
        });
      }
    });

    return added;
  } catch {
    setLoadError(true);
    return [];
  } finally {
    loadingRef.current = false;
    setIsLoading(false);
  }
}, [measureCards, nextPageDataHref, photos]);
```

注意：移除依赖数组中的 `isLoading`，因为同步锁已经负责防并发。

- [ ] **Step 4: 验证**

Run:

```powershell
npm run test:photos
```

Expected: PASS。

- [ ] **Step 5: 提交建议**

```powershell
git add src/components/photos/PhotoGallery.tsx tests/photos.test.ts
git commit -m "fix: 防止相册加载更多重复请求"
```

---

### Task 4: 明确相册增量加载 URL 策略

**Files:**
- Modify: `src/components/photos/PhotoGallery.tsx`
- Modify: `tests/photos.test.ts`
- Modify: `docs/project-knowledge/photos-gallery.md`

**Decision Notes:**  
JS 增量加载时不再调用 `window.history.pushState()`。`nextHref` 仍保留在 `<a href>` 上，确保无 JS、搜索引擎和直接打开分页 URL 时可访问；JS 接管点击后只增量追加内容，不改变地址栏。这避免 `/island/photos/2026/page/2/` 在“直接访问”和“从第 1 页加载更多后访问”之间呈现不同语义。

- [ ] **Step 1: 写失败测试**

在 `tests/photos.test.ts` 末尾添加：

```ts
test('keeps incremental photo loading on the current archive URL', () => {
  const source = readFileSync(
    new URL('../src/components/photos/PhotoGallery.tsx', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(source, /window\.history\.pushState/);
  assert.doesNotMatch(source, /window\.addEventListener\('popstate'/);
  assert.match(source, /href=\{nextPageHref\}/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:photos
```

Expected: FAIL，因为当前实现仍有 `window.history.pushState()` 和 `popstate` listener。

- [ ] **Step 3: 移除客户端分页 history 耦合**

从 `src/components/photos/PhotoGallery.tsx` 删除整个 `popstate` effect：

```tsx
useEffect(() => {
  const handlePopState = () => {
    const currentBatch = batches.find(({ page: batchPage }) => (
      window.location.pathname.endsWith(`/page/${batchPage}/`)
      || (batchPage === 1 && !window.location.pathname.includes('/page/'))
    ));
    if (currentBatch) {
      document.querySelector(`[data-photo-batch="${currentBatch.page}"]`)
        ?.scrollIntoView({ block: 'start' });
    }
  };
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [batches]);
```

从 `loadNextPage` 删除：

```tsx
window.history.pushState({ photoPage: payload.page }, '', payload.href);
```

保留分页按钮：

```tsx
<a
  className="photo-gallery__load-more"
  href={nextPageHref}
  aria-disabled={isLoading}
  onClick={(event) => {
    if (!nextPageDataHref) {
      return;
    }
    event.preventDefault();
    void loadNextPage();
  }}
>
```

- [ ] **Step 4: 更新项目知识快照**

在 `docs/project-knowledge/photos-gallery.md` 增加一节：

```md
## 相册分页 URL 策略

相册保留静态分页 URL，用于无 JS、SEO 和直接访问。例如 `/island/photos/2026/page/2/` 可以独立渲染第 2 页。

客户端“加载更多”只在当前归档 URL 内追加下一批照片，不调用 `window.history.pushState()`。这样可以避免同一个分页 URL 在直接访问和客户端累积加载路径下展示不同内容结构。
```

- [ ] **Step 5: 验证**

Run:

```powershell
npm run test:photos
npm run build
```

Expected: 两个命令均 PASS。

- [ ] **Step 6: 提交建议**

```powershell
git add src/components/photos/PhotoGallery.tsx tests/photos.test.ts docs/project-knowledge/photos-gallery.md
git commit -m "fix: 调整相册增量加载的分页地址策略"
```

---

### Task 5: 清理 InitialLoadingOverlay 的已看过路径

**Files:**
- Modify: `src/components/site/InitialLoadingOverlay.tsx`
- Modify: `tests/initial-loading.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/initial-loading.test.ts` 末尾添加：

```ts
test('checks seen loading state before importing the UI Loading component', () => {
  const seenCheckIndex = initialLoadingSource.indexOf('window.sessionStorage.getItem(loadingStorageKey)');
  const importIndex = initialLoadingSource.indexOf("import('animal-island-ui')");

  assert.ok(seenCheckIndex >= 0);
  assert.ok(importIndex >= 0);
  assert.ok(seenCheckIndex < importIndex);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm run test:loading
```

Expected: FAIL，因为当前实现先动态 import，再检查 sessionStorage。

- [ ] **Step 3: 最小实现**

调整 `src/components/site/InitialLoadingOverlay.tsx` 的 effect 顺序：

```tsx
useEffect(() => {
  let isCancelled = false;

  try {
    if (window.sessionStorage.getItem(loadingStorageKey) === 'true') {
      window.__islandInitialLoadingComplete = true;
      setIsActive(false);
      setIsMounted(false);
      return () => {
        isCancelled = true;
      };
    }

    window.sessionStorage.setItem(loadingStorageKey, 'true');
  } catch {
    // Storage can be unavailable in private contexts; the loading still degrades safely.
  }

  import('animal-island-ui').then(({ Loading }) => {
    if (!isCancelled) {
      setLoadingComponent(() => Loading);
    }
  });

  const hideTimer = window.setTimeout(() => {
    announceInitialLoadingComplete();
    setIsActive(false);
  }, visibleDuration);

  const removeTimer = window.setTimeout(() => {
    setIsMounted(false);
  }, visibleDuration + exitDuration);

  return () => {
    isCancelled = true;
    window.clearTimeout(hideTimer);
    window.clearTimeout(removeTimer);
  };
}, []);
```

- [ ] **Step 4: 验证**

Run:

```powershell
npm run test:loading
```

Expected: PASS。

- [ ] **Step 5: 提交建议**

```powershell
git add src/components/site/InitialLoadingOverlay.tsx tests/initial-loading.test.ts
git commit -m "fix: 优化首页首次加载组件的已看过路径"
```

---

### Task 6: 全量验证与浏览器验收

**Files:**
- Verify: `src/components/photos/PhotoLightbox.tsx`
- Verify: `src/components/photos/PhotoGallery.tsx`
- Verify: `src/components/site/SiteHeader.astro`
- Verify: `src/components/site/InitialLoadingOverlay.tsx`

- [ ] **Step 1: 运行全量测试**

Run:

```powershell
npm test
```

Expected: PASS，包含新增的 `test:lightbox` 和 `test:navigation`。

- [ ] **Step 2: 运行构建**

Run:

```powershell
npm run build
```

Expected: PASS，静态路由仍包含首页、项目页、相册归档页、相册 JSON、文章列表页、文章详情页和岛民卡页。

- [ ] **Step 3: 浏览器验收**

Run:

```powershell
npm run dev
```

Manual checks:

- 打开 `/island/photos/`，点击任意照片打开 Lightbox。
- 在 Lightbox 中连续切换上一张/下一张，背景页面不能滚动。
- 在 Lightbox 最后一张继续下一张触发加载更多时，不能重复请求同一页。
- 点击 `/island/photos/2026/`，导航栏高亮“海风相册”。
- 点击 `/island/notes/island-home-start/`，导航栏高亮“留言木屋”。
- 在 `/island/photos/` 点击“加载更多”，地址栏保持当前归档 URL，按钮的无 JS `href` 仍指向下一页。
- 首次进入首页展示 loading；同一会话再次进入首页不展示 loading。

- [ ] **Step 4: 最终检查**

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` 没有空白错误；`git status --short` 只包含本计划涉及的文件。

---

## Decision Notes

- **子 agent 使用策略：** 默认允许使用子 agent 执行任务和复核；当用户明确说“不使用子 agent”时禁止使用。
- **相册 URL 策略：** 保留静态分页 URL 给无 JS 和直接访问；JS 增量加载不改变地址栏。
- **InitialLoading 优先级：** 这是低风险清理项，不阻塞前四个交互修复。
- **测试策略：** 继续沿用当前项目的 Node Test Runner 和源码约束测试，不引入 jsdom、Playwright 或额外测试依赖。
- **国际化范围：** 本计划不新增展示文案；若实施时新增中文展示文本，必须使用现有 `t(locale, '中文原文')` 方式并补充反查映射。

## Self-Review

- **Spec coverage:** 覆盖已确认的 4 个有效审查项，以及 1 个降级为清理项的问题。
- **Placeholder scan:** 文档没有使用待补充占位项；每个任务都给出了具体文件、测试、实现片段和验证命令。
- **Type consistency:** 计划中新增函数 `normalizePath()` 和 `isNavigationItemActive()` 的签名在测试与实现中一致；相册任务保持现有 `PhotoItem[]`、`PhotoArchivePage`、`loadNextPage()` 类型不变。
