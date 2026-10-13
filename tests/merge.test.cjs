#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const indexPath = path.resolve(__dirname, '..', 'index.html');
const indexHTML = fs.readFileSync(indexPath, 'utf8');
const i18nStart = indexHTML.indexOf('        const i18n = {');
const scriptStart = indexHTML.lastIndexOf('<script>', i18nStart);
const scriptEnd = indexHTML.indexOf('\n    </script>', i18nStart);
assert.ok(i18nStart !== -1 && scriptStart !== -1 && scriptEnd !== -1, 'could not locate the app inline script');
const appScript = indexHTML.slice(scriptStart + '<script>'.length, scriptEnd);

function createApp() {
    const dom = new JSDOM(indexHTML, {
        runScripts: 'outside-only',
        url: 'http://codeblend.test/'
    });
    const { window } = dom;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    window.eval(appScript);
    const toasts = [];
    window.showToast = (message, isError = false) => toasts.push({ message, isError });
    return { window, toasts, close: () => window.close() };
}

function smartReplace(original, aiReply, previousResult = 'UNCHANGED_RESULT') {
    const app = createApp();
    app.window.document.getElementById('code1').value = original;
    app.window.document.getElementById('code2').value = aiReply;
    app.window.document.getElementById('code3').value = previousResult;
    app.window.performSmartReplace();
    return {
        ...app,
        result: app.window.document.getElementById('code3').value
    };
}

function test(name, fn) {
    try {
        fn();
        console.log(`PASS ${name}`);
    } catch (error) {
        console.error(`FAIL ${name}`);
        throw error;
    }
}

test('replaces the complete nested source range selected by a unique AI id', () => {
    const original = '<main>\n  <div class="shell"><div id="target"><div>old nested</div></div></div>\n</main>';
    const ai = '```html\n<section id="target"><span>new nested</span></section>\n```';
    const app = smartReplace(original, ai);
    assert.equal(app.result, '<main>\n  <div class="shell"><section id="target"><span>new nested</span></section></div>\n</main>');
    app.close();
});

test('rejects a replacement whose exact AI id is duplicated in the source', () => {
    const original = '<main><article id="shared">one</article><section id="shared">two</section></main>';
    const app = smartReplace(original, '<article id="shared">replacement</article>');
    assert.equal(app.result, 'UNCHANGED_RESULT');
    assert.equal(app.toasts.at(-1).isError, true);
    assert.match(app.toasts.at(-1).message, /多個可能|Multiple possible/);
    app.close();
});

test('uses a complete doctype/html response as the complete result', () => {
    const completeDocument = '<!doctype html>\n<html><head><title>New</title></head><body><p id="new">document</p></body></html>';
    const app = smartReplace('<html><body><p>old</p></body></html>', `Here is the complete page:\n\`\`\`html\n${completeDocument}\n\`\`\``);
    assert.equal(app.result, completeDocument);
    app.close();
});

test('does not map fake tags inside script raw text as source elements', () => {
    const original = '<html><head></head><body><script>const fake = "<div id=\\"fake\\"></div>";</script><div id="target">old</div></body></html>';
    const app = smartReplace(original, '<div id="target">new</div>');
    assert.equal(app.result, '<html><head></head><body><script>const fake = "<div id=\\"fake\\"></div>";</script><div id="target">new</div></body></html>');
    app.close();
});

test('rejects multi-block HTML/CSS/JS answers instead of silently dropping blocks', () => {
    const reply = '```html\n<div id="target">new</div>\n```\n```css\n#target { color: red; }\n```\n```js\nconsole.log("keep me");\n```';
    const app = smartReplace('<div id="target">old</div>', reply);
    assert.equal(app.result, 'UNCHANGED_RESULT');
    assert.equal(app.toasts.at(-1).isError, true);
    assert.match(app.toasts.at(-1).message, /多個程式碼區塊|multiple code blocks/i);
    app.close();
});

test('does not flag ordinary ASCII text as an encoding warning', () => {
    const app = createApp();
    assert.equal(app.window.detectEncodingWarning('Plain ASCII only: <div id="a">hello 123</div>'), '');
    app.close();
});

test('keeps every non-replaced original source byte rather than serializing the DOM', () => {
    const originalTarget = '<div data-z=\'1\' id="target" data-x="a&amp;b">\n    old\n  </div>';
    const original = '<!doctype html>\n<!-- preserve this comment -->\n<html data-original=\'yes\'><body>\n  ' + originalTarget + '\n  <p data-order="second"  class=\'note\'>unchanged &amp; exact</p>\n</body></html>';
    const replacement = '<section id="target">new</section>';
    const app = smartReplace(original, replacement);
    assert.equal(app.result, original.replace(originalTarget, replacement));
    app.close();
});

test('continues to inject a single style element before the original head closing tag', () => {
    const original = '<!doctype html><html><head><meta charset="utf-8"></head><body><p>keep</p></body></html>';
    const app = smartReplace(original, '<style>#x { color: red; }</style>');
    assert.equal(app.result, '<!doctype html><html><head><meta charset="utf-8">\n<style>#x { color: red; }</style>\n</head><body><p>keep</p></body></html>');
    app.close();
});

console.log('All merge tests passed.');
