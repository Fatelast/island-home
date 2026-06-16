# Stable Site Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除完整页面导航时顶部 Header 的重复进入动画，同时保留导航链接自身交互反馈。

**Architecture:** `pageMotion.ts` 仅负责内容区域进入动画和非导航控件交互。`SiteHeader.astro` 独立负责导航 hover、active、focus 样式，避免 CSS 与 GSAP 同时写入 transform。

**Tech Stack:** Astro、TypeScript、GSAP、Node Test Runner

---

### Task 1: 添加回归测试

**Files:**
- Create: `tests/page-motion.test.ts`
- Modify: `package.json`

- [x] 断言 Header 不出现在 GSAP 页面进入动画中。
- [x] 断言导航链接不出现在 GSAP hover 目标中。
- [x] 断言导航 CSS 仍保留 hover、active 交互。
- [x] 运行测试并确认旧实现失败。

### Task 2: 收窄全局页面动画

**Files:**
- Modify: `src/scripts/pageMotion.ts`

- [x] 移除 `.site-header` 进入动画。
- [x] 从 GSAP hover 目标中移除 `.site-header__link`。
- [x] 运行测试并确认通过。

### Task 3: 验证

- [x] 运行 `npm test`。
- [x] 运行 `npm run build`。
- [x] 浏览器逐帧检查 Header 首帧位置。
- [x] 检查 hover、active 和 focus 反馈。
