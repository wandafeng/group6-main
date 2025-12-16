# 部署到 GitHub Pages 說明

## 重要提示：修復 Token 權限問題

你的 GitHub Personal Access Token 缺少 `workflow` 權限。請先按以下步驟更新：

### 更新 GitHub Token 權限

1. 進入 https://github.com/settings/tokens
2. 找到你正在使用的 Personal Access Token
3. 點擊編輯，勾選 `workflow` 權限
4. 保存更改

完成後，使用下面的**方案一**推送 workflow 文件即可。

---

## 部署方案

由於需要自動化部署，這裡提供三種方案：

## 方案一：直接從本地推送（需要更新 Token 權限）

完成上面的 Token 權限更新後：

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow"
git push origin main
```

然後進入 GitHub Settings → Pages，選擇 **GitHub Actions** 作為 Source。

## 方案二：使用 GitHub 網頁界面創建 Workflow

如果不想更新 Token 權限，可以直接在 GitHub 網頁上創建：

1. 進入你的 GitHub repository: https://github.com/llaurraa/group6

2. 點擊 **Actions** 標籤

3. 點擊 **New workflow** 或 **set up a workflow yourself**

4. 使用以下配置:

將以下內容複製到 workflow 文件中（重要：移除了 `cache: 'npm'` 以避免 lock file 錯誤）:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

5. 將文件命名為 `deploy.yml`，然後點擊 **Commit changes**

6. 進入 **Settings** → **Pages**，選擇 **GitHub Actions** 作為 Source

8. （可選）如果需要 Gemini API:
   - 進入 **Settings** → **Secrets and variables** → **Actions**
   - 新增 secret: `GEMINI_API_KEY`

9. 遊戲將自動部署到: `https://llaurraa.github.io/group6/`

## 方案二：手動構建並部署（本地操作）

如果你已經安裝好 Node.js 和 npm:

1. 安裝依賴:
```bash
npm install
```

2. 構建項目:
```bash
npm run build
```

3. 安裝 gh-pages:
```bash
npm install -D gh-pages
```

4. 手動部署:
```bash
npm run deploy
```

## 方案三：手動構建並部署（適合測試）

如果你想在本地構建並手動上傳：

1. 安裝依賴並構建:
```bash
npm install
npm run build
```

2. 安裝並使用 gh-pages:
```bash
npm install -D gh-pages
npm run deploy
```

這會將 `dist` 文件夾部署到 `gh-pages` 分支。記得在 Settings → Pages 中將 Source 改為 `gh-pages` 分支。

---

## 當前配置

項目已經配置好以下設置:
- ✅ Vite base path 設置為 `/group6/`
- ✅ Package.json 包含部署腳本
- ✅ .gitignore 排除 node_modules 和 dist

只需要選擇上面任一方案完成部署即可！
