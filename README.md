# CodeBlend AI

CodeBlend AI 是一款智能 HTML 代碼融合工具，專為前端開發者設計：
- 自動從 AI 回覆中提取 HTML / CSS / JS
- 智能地替換或注入到你嘅原始檔案

## 主要功能
- **智能分析替換**：自動識別並替換現有 HTML 標籤
- **代碼注入**：自動將 `<style>` 注入 `<head>`，`<script>` 注入 `</body>` 前
- **即時預覽**：支援桌面與手機模式預覽
- **健康檢查**：自動檢查常見語法錯誤（例如未閉合標籤）
- **黑夜模式**：流暢日/夜主題切換
- **多語言**：中文 / 英文介面

## 本地使用
直接用瀏覽器打開 `index.html` 即可。

## 放上 GitHub（建議用 GitHub Pages）
1. 新建一個 GitHub Repo（例如 `CodeBlend_AI`）
2. 將以下檔案放到 Repo 根目錄：
   - `index.html`
   - `icon.png`
   - `manifest.json`
   - `sw.js`
   - `README.md`
3. 去 **Settings → Pages**
   - **Build and deployment** 選 **Deploy from a branch**
   - Branch 選 `main`，Folder 選 `/ (root)`
4. 等 1–2 分鐘，GitHub Pages 會俾你一條網址

## 像手機 App 一樣使用（PWA 安裝）
- **Android (Chrome)**：右上角 ⋮ → *Install app* / *加入主畫面*
- **iPhone/iPad (Safari)**：分享按鈕 → *加入主畫面*

> 注意：呢個版本依賴 Tailwind / FontAwesome / Google Fonts 等 CDN。
> `sw.js` 主要快取本地檔案，離線模式未必能完整顯示所有外部資源。

## 授權
MIT License（如要嚴格對應，建議你再加一個 `LICENSE` 檔案到 Repo）
