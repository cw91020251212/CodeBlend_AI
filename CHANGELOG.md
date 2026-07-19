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
