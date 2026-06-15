# 部署说明

项目由两个独立部署组成：

- Sanity Studio：内容管理后台，托管于 `https://island-home.sanity.studio/`。
- Astro 前台：静态站点，部署到 Cloudflare Pages。

## Sanity Studio

首次部署已经完成。后续更新后台时运行：

```powershell
Set-Location studio
npm install
npm run build
npm run deploy -- --yes --schema-required
```

Studio 使用以下本地环境变量：

```dotenv
SANITY_STUDIO_PROJECT_ID=ypkwhakf
SANITY_STUDIO_DATASET=production
```

这些值保存在 `studio/.env`，该文件不提交 Git。

## Cloudflare Pages

在 Cloudflare 控制台选择：

```text
Workers & Pages
→ Create application
→ Pages
→ Import an existing Git repository
```

构建配置：

```text
Framework preset: Astro
Production branch: 实际生产分支
Root directory: /
Build command: npm run test && npm run build
Build output directory: dist
```

生产环境变量：

```dotenv
PUBLIC_SANITY_PROJECT_ID=ypkwhakf
PUBLIC_SANITY_DATASET=production
SANITY_API_VERSION=2026-06-15
SITE_URL=https://<项目名>.pages.dev
NODE_VERSION=22.12.0
```

不要配置 `SANITY_MIGRATION_TOKEN`。前台只读取公开数据集中的已发布内容。

## 自动更新内容

Cloudflare Pages 首次部署完成后，在 Pages 项目的 Builds 设置中创建 Deploy Hook：

```text
Name: sanity-content
Branch: 生产分支
```

然后在 Sanity Manage 为 `production` 数据集创建 Webhook：

```text
Name: Cloudflare Pages production
URL: <Cloudflare Deploy Hook URL>
Trigger on: create, update, delete
HTTP method: POST
Filter: !(_id in path("drafts.**"))
```

Deploy Hook URL 等同部署触发凭据，不写入仓库。

## 发布检查

本地验证：

```powershell
npm run test
npm run build
Set-Location studio
npm run build
```

排查顺序：

1. Sanity 中确认内容已经 Publish，而不是只保存草稿。
2. Cloudflare 构建日志中确认三个 Sanity 环境变量存在。
3. 内容未更新时检查 Sanity Webhook 投递记录和 Deploy Hook。
4. 构建失败时保留上一版生产部署，修复变量后重新触发构建。
