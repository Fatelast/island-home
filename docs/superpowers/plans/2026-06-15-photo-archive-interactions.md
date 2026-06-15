# Photo Archive Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复年份归档页宽度失控，并为相册卡片增加适合数百张照片规模的克制交互动效。

**Architecture:** 共享页面宽度样式由 `PhotoArchivePage.astro` 统一加载，避免静态首页与动态归档路由依赖不一致。卡片动效集中在 `PhotoGallery.tsx`，通过容器事件委托和 `gsap.quickTo()` 驱动当前悬停卡片，卡片组件仅提供语义化动效目标。

**Tech Stack:** Astro、React 19、TypeScript、GSAP、Node Test Runner、CSS Grid

---

### Task 1: 归档页面宽度回归

**Files:**
- Modify: `tests/photos.test.ts`
- Modify: `src/components/photos/PhotoArchivePage.astro`
- Modify: `src/pages/island/photos/index.astro`

- [ ] 添加测试，断言共享相册页面组件加载 `island-pages.css`，根路由不再独占该依赖。
- [ ] 运行 `npm run test:photos`，确认测试因共享组件尚未导入样式而失败。
- [ ] 将样式导入移动到 `PhotoArchivePage.astro`。
- [ ] 再次运行 `npm run test:photos`，确认测试通过。

### Task 2: 卡片动效值与结构

**Files:**
- Create: `src/lib/photo-card-motion.ts`
- Modify: `tests/photos.test.ts`
- Modify: `src/components/photos/PhotoCard.tsx`

- [ ] 添加测试，断言卡片中心点倾斜为零、边缘倾斜不超过 3 度。
- [ ] 运行 `npm run test:photos`，确认因动效计算函数不存在而失败。
- [ ] 实现纯函数 `getPhotoCardMotion()`，输出受限的 `rotationX`、`rotationY` 和高光偏移。
- [ ] 为卡片补充 media、overlay、shine 的数据目标。
- [ ] 再次运行 `npm run test:photos`，确认测试通过。

### Task 3: GSAP 事件委托交互

**Files:**
- Modify: `src/components/photos/PhotoGallery.tsx`
- Modify: `src/components/photos/PhotoGallery.css`

- [ ] 在画廊容器集中注册 pointer、focus 事件，使用 `contextSafe()` 和清理函数。
- [ ] 使用 `gsap.quickTo()` 更新当前卡片倾斜和高光位置。
- [ ] 增加悬停上浮、媒体放大、详情浮现、按压反馈。
- [ ] 为触摸设备和 `prefers-reduced-motion` 提供无倾斜降级。
- [ ] 运行完整测试和构建。

### Task 4: 浏览器验收

**Files:**
- Verify: `/island/photos/`
- Verify: `/island/photos/2026/`

- [ ] 检查两条路由内容宽度一致且无横向溢出。
- [ ] 检查桌面端 hover、focus、press 与大图点击。
- [ ] 检查移动端单列布局和无 hover 残留。
- [ ] 更新项目知识快照。
