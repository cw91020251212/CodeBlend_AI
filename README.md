# CodeBlend AI

CodeBlend AI 保留原有三栏 HTML 代码融合流程，并新增「视觉草稿 / AI 交接」。你可以先在画面上表达想要的修改，再把完整任务交给能读取、修改真实项目文件的 AI。

**视觉草稿不会修改原始代码、融合结果或磁盘文件。导出不等于 AI 已执行。** 本工具没有内置 AI 调用，也不会自动上传源码或附件；用户操作导出后才产生本地文件。依赖外部 CSS、图片和 CDN 时，浏览器仍可能发出资源请求。

## 视觉草稿怎么用

1. 在第 1 栏载入或贴上原始 HTML。若已有第 3 栏融合结果，画布会以第 3 栏为基准，并同时保留原始代码供 AI 对照。
2. 打开第 2 栏的「视觉草稿 / AI 交接」。点选元素，填写颜色、大小、间距或元素要求，按「记录并预演」。文字修改需勾选文字选项，可表示删除成空文字；容器有子元素时只记录要求，不会用纯文字破坏其子结构。
3. 选择「所有尺寸 / 电脑 / 手机」作用范围。可切换画布尺寸。拖动需先开启「拖动意图」；它表示期望位移，不是已经完成的响应式排版。
4. 补充整体要求和真实文件路径。可加入相关 CSS、JS、TS/JSX/TSX、Vue/Svelte 源码与 PNG/JPEG/WebP/GIF 参考图。允许单个附件最多 10 MB、合计 50 MB；不自动读取目录、GitHub 或后台，不接受常见密钥文件。导出前仍须自行检查源码及附件是否包含凭证或私人数据。
5. 下载 `codeblend-ai-handoff.json` 或 Markdown AI 任务，或者复制完整交接。已填但尚未按「记录」的元素字段会在导出时一并记录，避免遗漏。复制过大的附件包可能超出聊天工具限制，建议用文件附件或原项目仓库授权。
6. 把任务交给 AI，同时提供真实项目文件访问权限。任务明确要求 AI 改动源文件、保留事件与数据逻辑、验证电脑/手机及相关功能，并报告 diff 和未完成项目。

草稿仅在当前页面内存保留。关掉工作区再打开仍保留；刷新网页会清空，应先导出。原始代码或融合结果发生变化时，旧草稿不会自动套到新版本；先导出旧草稿或清除，再重新开始。

## 能做到与不能保证的事

简单静态 HTML 可以安全地人工修改真实源代码，也可以在工具中表达设计要求。不过，任意网页的浏览器画面不能自动可靠逆向成所有源码：外部 CSS、JavaScript 状态、React/Vue 组件、后端模板和数据可能都不在载入的 HTML 内。

视觉画布是静态隔离预览，禁止用户脚本、事件、表单和嵌入页面运行。依赖 JavaScript 生成的画面可能缺失。原网站完整页面网址可帮助解析相对 CSS/图片，但不等于取得完整项目；此时请增加真实源文件和参考图。普通「预览」可执行脚本，但使用不与编辑器同源的 sandbox，不能直接改编辑器内容；它也不是完整功能测试。

DOM 元素快照和计算样式只作为定位提示。交接包始终保留已载入的原始源码文本，不把浏览器归一化后的 DOM 冒充源文件，也不会声称某个 DOM 一定对应某个组件行号。

## 原来的三栏功能

可从 AI 回答提取 HTML，定位安全目标并输出融合结果；第 3 栏可复制、分享或另存 HTML。这不自动改动其他项目文件。「HTML 标签检查」只检查标签配对，不证明 CSS、JavaScript、数据或交互正确。

## 本地或 GitHub Pages 使用

直接打开 `index.html`，或用静态 HTTP 服务器运行整个目录。必须保留 `visual-intent.js`、`visual-intent.css`、`manifest.json`、`sw.js` 和 `icons/`。部署方式沿用 GitHub Pages 的主分支根目录，无新增后端服务。

界面依赖现有 Tailwind / FontAwesome / Google Fonts CDN；离线时外部资源可能无法完整加载。PWA 缓存版本更新为 `codeblend-ai-v5-intent`，新增模块加入核心缓存。

## 开发验证

安装开发测试依赖（不影响网站运行）：

```sh
npm install --prefix /tmp/codeblend-test playwright jsdom
/tmp/codeblend-test/node_modules/.bin/playwright install chromium
python3 -m http.server 8765 --bind 127.0.0.1
```

另一个终端运行：

```sh
NODE_PATH=/tmp/codeblend-test/node_modules node tests/visual-intent.test.cjs
NODE_PATH=/tmp/codeblend-test/node_modules node tests/merge.test.cjs
node --check visual-intent.js
node --check sw.js
```

## 授权

MIT License，见 `LICENSE`。
