/* Run: NODE_PATH=/path/to/node_modules node tests/visual-intent.test.cjs [base URL] */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const SOURCE = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><style>#target{color:red;width:120px} .card{padding:12px}</style></head><body><div class="card"><button id="target" onclick="window.testClick=1">Old</button><span>Keep</span></div><script>parent.document.getElementById('code1').value='CORRUPTED';window.canvasScriptRan=1;</script><iframe src="https://example.com"></iframe></body></html>`;
(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    // Deterministic offline chrome: Tailwind CDN is irrelevant to logic tests.
    await page.route('**/*', route => route.request().url().startsWith(BASE) ? route.continue() : route.abort());
    await page.goto(BASE);
    await page.evaluate(() => { resetWholeProgram(); }); // Reset before ever opening the visual UI must be safe.
    await page.locator('#code1').fill(SOURCE);
    await page.locator('[onclick="visualReplaceMock()"]').click();
    const canvas = page.frameLocator('#vi-frame');
    await canvas.locator('#target').click();
    await page.locator('#vi-style-0').fill('#0000ff');
    await page.locator('#vi-style-7').fill('16px');
    await page.locator('#vi-edit-text').check();
    await page.locator('#vi-text').fill('New 文案');
    await page.locator('#vi-note').fill('保留点击功能');
    await page.locator('#vi-apply').click();
    assert.equal(await page.locator('#code1').inputValue(), SOURCE);
    assert.equal(await page.locator('#code3').inputValue(), '');
    assert.equal(await canvas.locator('#target').textContent(), 'New 文案');
    await page.locator('#vi-note').fill('切换元素前的要求');
    await canvas.locator('span').click();
    assert.equal((await page.evaluate(() => CodeBlendIntent.buildPackage())).intents[1].desired.note, '切换元素前的要求');
    await page.locator('#vi-undo').click();
    await canvas.locator('#target').waitFor();
    await page.locator('#vi-note').focus();
    await page.evaluate(() => saveStateToUndo());
    await page.keyboard.press('Control+z');
    assert.equal(await page.locator('#code1').inputValue(), SOURCE);
    assert.equal(await canvas.locator('#target').textContent(), 'New 文案');
    assert.equal(await canvas.locator('#target').evaluate(el => getComputedStyle(el).color), 'rgb(0, 0, 255)');
    assert.equal(await canvas.locator('iframe').count(), 0);
    assert.equal(await canvas.locator('script').count(), 0);
    assert.equal(await canvas.locator('#target').getAttribute('onclick'), null);
    await page.locator('#vi-drag').check();
    const box = await canvas.locator('#target').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20, { steps: 4 });
    await page.mouse.up();
    let dragged = await page.evaluate(() => CodeBlendIntent.buildPackage());
    assert.deepEqual(dragged.intents[1].desired.offset, { x: 30, y: 20 });
    assert.equal(await page.locator('#code1').inputValue(), SOURCE);
    await page.locator('#vi-drag').uncheck();
    await page.locator('#vi-undo').click();
    await canvas.locator('#target').waitFor();
    await page.locator('#vi-global').fill('手机改成单栏，真正修改源代码');
    await page.locator('#vi-filename').fill('src/page.html');
    await page.locator('#vi-files').setInputFiles([
        { name: 'style.css', mimeType: 'text/css', buffer: Buffer.from('.card{display:flex}') },
        { name: '.env', mimeType: 'text/plain', buffer: Buffer.from('DO_NOT_EXPORT=secret') },
        { name: 'reference.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }
    ]);
    await page.waitForFunction(() => document.getElementById('vi-attachments').children.length === 2);
    // Unsaved form changes are included at export time.
    await canvas.locator('span').click();
    await page.locator('#vi-note').fill('这一项未按记录按钮，也必须导出');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#vi-json').click();
    const download = await downloadPromise;
    const dir = process.env.CODEBLEND_ARTIFACT_DIR || '/tmp/codeblend-intent-tests';
    await fs.mkdir(dir, { recursive: true });
    const output = path.join(dir, 'codeblend-ai-handoff-example.json');
    await download.saveAs(output);
    const pack = JSON.parse(await fs.readFile(output, 'utf8'));
    assert.equal(pack.executionStatus, 'not-executed');
    assert.equal(pack.source.originalHtml, SOURCE);
    assert.equal(pack.source.draftBaselineHtml, SOURCE);
    assert.equal(pack.source.path, 'src/page.html');
    assert.equal(pack.overallRequirements, '手机改成单栏，真正修改源代码');
    assert.equal(pack.intents.length, 2);
    assert.equal(pack.intents[0].desired.styles.color, '#0000ff');
    assert.equal(pack.intents[0].target.attributes.onclick, 'window.testClick=1');
    assert.equal(pack.intents[1].desired.note, '这一项未按记录按钮，也必须导出');
    assert.equal(pack.attachments.length, 2);
    assert.equal(pack.attachments[0].content, '.card{display:flex}');
    assert.match(pack.attachments[1].content, /^data:image\/png;base64,/);
    assert(!JSON.stringify(pack).includes('DO_NOT_EXPORT'));
    // Stable selector points to the source DOM; no draft-specific IDs used.
    assert.match(pack.intents[0].target.selector, /button:nth-of-type\(1\)$/);
    assert(!pack.intents[0].target.outerHTML.includes('data-codeblend'));
    const mdPromise = page.waitForEvent('download');
    await page.locator('#vi-markdown').click();
    const mdDownload = await mdPromise;
    const mdOutput = path.join(dir, 'codeblend-ai-handoff-example.md');
    await mdDownload.saveAs(mdOutput);
    const md = await fs.readFile(mdOutput, 'utf8');
    assert.match(md, /真正修改原项目文件/);
    assert.match(md, /这一项未按记录按钮，也必须导出/);
    assert.match(md, /data:image\/png;base64,/);
    await page.locator('#vi-undo').click();
    await page.waitForFunction(() => document.getElementById('vi-count').textContent === '1');
    await canvas.locator('#target').waitFor();
    assert.equal(await canvas.locator('#target').textContent(), 'New 文案');
    await page.locator('#vi-undo').click();
    await page.waitForFunction(() => document.getElementById('vi-count').textContent === '0');
    await canvas.locator('#target').waitFor();
    assert.equal(await canvas.locator('#target').textContent(), 'Old');
    // Container text never destroys its children in the preview.
    await canvas.locator('.card').click({ position: { x: 3, y: 3 } });
    await page.locator('#vi-edit-text').check();
    await page.locator('#vi-text').fill('Container rewrite');
    await page.locator('#vi-apply').click();
    assert.equal(await canvas.locator('#target').count(), 1);
    let pack2 = await page.evaluate(() => CodeBlendIntent.buildPackage());
    assert.equal(pack2.intents[0].textPreviewApplied, false);
    // Scope is respected in the preview and exported.
    await canvas.locator('#target').click();
    await page.locator('#vi-scope').selectOption('mobile');
    await page.locator('#vi-style-0').fill('green');
    await page.locator('#vi-apply').click();
    assert.equal(await canvas.locator('#target').evaluate(el => getComputedStyle(el).color), 'rgb(255, 0, 0)');
    await page.locator('#vi-mobile').click();
    await canvas.locator('#target').waitFor();
    assert.equal(await canvas.locator('#target').evaluate(el => getComputedStyle(el).color), 'rgb(0, 128, 0)');
    // Invalid CSS must not add an intent.
    await canvas.locator('#target').click();
    await page.locator('#vi-style-2').fill('nonsense');
    await page.locator('#vi-apply').click();
    assert.equal(await page.locator('#vi-count').textContent(), '2');
    await page.locator('#vi-style-2').fill('');
    // Source changes do not silently rebase old intents.
    await page.locator('#vi-note').fill('关闭前尚未按记录的要求');
    await page.locator('#vi-close').click();
    await page.locator('#code1').fill(SOURCE + '\n<!-- new source -->');
    await page.locator('[onclick="visualReplaceMock()"]').click();
    assert.match(await page.locator('#vi-status').textContent(), /原始碼或融合結果已改變/);
    const oldDraft = await page.evaluate(() => CodeBlendIntent.buildPackage());
    assert.equal(oldDraft.source.originalHtml, SOURCE);
    assert.equal(oldDraft.editorVersionMismatch, true);
    assert.equal(oldDraft.intents.at(-1).desired.note, '关闭前尚未按记录的要求');
    assert.equal(await page.locator('main').evaluate(el => el.inert), true);
    // Runtime preview executes in a separate opaque origin, not the editor origin.
    await page.locator('#vi-close').click();
    await page.evaluate(() => openPreview());
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#code1').inputValue(), SOURCE + '\n<!-- new source -->');
    assert.equal(await page.locator('#previewFrame').getAttribute('sandbox'), 'allow-scripts');
    await page.evaluate(() => closePreview());
    assert.equal(await page.locator('#previewFrame').getAttribute('srcdoc'), null);
    // Mobile layout and English labels.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { resetWholeProgram(); });
    await page.locator('#code1').fill(SOURCE);
    await page.evaluate(() => { switchTab(2); visualReplaceMock(); });
    await canvas.locator('#target').click();
    assert.equal(await page.locator('#vi-close').isVisible(), true);
    assert.equal(await page.locator('#code1').inputValue(), SOURCE);
    // Reset invalidates in-flight file reads; cleared files must not reappear.
    await page.evaluate(() => {
        const native = File.prototype.arrayBuffer;
        File.prototype.arrayBuffer = async function () { await new Promise(r => setTimeout(r, 200)); return native.call(this); };
    });
    await page.locator('#vi-files').setInputFiles({ name: 'discarded.css', mimeType: 'text/css', buffer: Buffer.from('SHOULD_NEVER_EXPORT') });
    await page.evaluate(() => CodeBlendIntent.reset());
    await page.waitForTimeout(300);
    assert.equal((await page.evaluate(() => CodeBlendIntent.buildPackage())).attachments.length, 0);
    await page.screenshot({ path: path.join(dir, 'visual-intent-mobile.png') });
    await page.locator('#vi-close').click();
    await page.reload();
    await page.evaluate(() => { toggleLanguage(); });
    await page.locator('#code1').fill('<html><body><h1>Hello</h1></body></html>');
    await page.evaluate(() => { switchTab(2); visualReplaceMock(); });
    assert.equal(await page.locator('#vi-title').textContent(), 'Visual Draft / AI Handoff');
    await browser.close();
    console.log('PASS: source isolation, safe canvas, exact handoff, pending changes, attachments, undo, container preservation, scope, validation, version mismatch, runtime isolation, mobile, English');
})().catch(error => { console.error(error); process.exit(1); });
