# CodeBlend 修訂說明

## 已修正

- 電腦版三欄編輯器高度：修正 Flex 版面未正確分配高度，三個程式碼區域現在會填滿主畫面並可獨立捲動。
- 程式碼文字顯示：修正桌面版 textarea 文字顏色被透明設定遮住的問題；手機版原有顯示不受影響。
- 語法檢查：由只檢查簡單 HTML 標籤配對，改為會報告行號、漏掉的結尾標籤、錯配標籤、多出的結尾標籤及尖括號數量不一致。
- 檢查範圍：優先檢查第 3 欄融合結果；如果第 3 欄未有內容，就檢查第 1 欄原始程式碼，報告會清楚標示範圍。

## 使用方式

直接用瀏覽器開啟 `index.html`。如要重新打包，把整個資料夾壓縮即可；`manifest.json`、`sw.js` 及 `icons/` 已一併保留。

## 驗證

已用瀏覽器測試桌面寬度 1280px：三個編輯器高度分別為 393px、349px、313px，程式碼文字可見；亦測試故意漏掉 `</span>` 的 HTML，檢查結果能指出第 2 行及漏掉的標籤。


## 本次更新

- 語法檢查報告加入「修正一個」：每次只修正一個已確認的 HTML 標籤配對問題，修正前會要求確認。
- 修正後會自動重新檢查，避免一次過改亂程式碼。
- 載入檔案改用編碼辨識，支援 UTF-8、UTF-8 BOM、UTF-16、Big5、GB18030；疑似亂碼只會提示，不會擅自修改文字。
- 語法修正只處理 HTML 標籤，不會改動 JavaScript、CSS 或中文內容。

## Cross-browser update

- Added explicit height and minimum-size rules for the desktop Flex layout so Edge does not collapse the editor panels.
- Added box sizing and zero margins/borders to the code textareas for consistent sizing across Chromium browsers.

## Mobile browser viewport update

- The app now follows the visible browser viewport using `visualViewport`, so the address bar and phone home gesture area no longer cover the bottom controls.

## Mobile result navigation

- Added a mobile-only Back button in column 3 that returns to the AI response column.

## 视觉草稿与 AI 交接

- 将原本只显示提示的视觉按钮接入真正的静态草稿工作区；支持元素选取、文字/样式要求、拖动位移、作用范围、撤销及整体要求。
- 明确区分草稿与源码；所有视觉操作不写入第 1/3 栏，不调用 AI，不自动上传文件。
- 导出完整 JSON / Markdown，携带原始代码、融合结果、草稿基准、目标 DOM 定位提示、全部修改意图、主动添加的源码与图片附件及实际执行要求。
- 导出、切换元素与画布尺寸时保存待录入字段；原源码变化时提示旧草稿版本不一致。
- 修复智能替换的同名嵌套元素损坏：采用保守源区间定位，不唯一就拒绝猜测，完整 HTML 直接作为结果，多代码块明确拒绝而不丢弃。
- 修复 ASCII 编码误报，将健康检查文案明确为 HTML 标签检查，不覆盖 CSS/JS/功能。
- 普通运行预览使用不同源 sandbox；静态草稿禁止执行用户脚本及事件。加载新文件时清除旧融合结果。
- 新增测试覆盖源码隔离、完整交接、真实拖动、附件、响应范围、移动界面及 8 项源码合并回归。
