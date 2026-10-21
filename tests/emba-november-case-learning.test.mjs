import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const chapterPath = date => `emba/content/2026/11_November/case-learning/${date}.md`;
const countBody = text => {
  const body = text.replace(/^---\n[\s\S]*?\n---\n\n/, '').replace(/^>? ?新版案例教材[^\n]*\n\n/, '');
  return (body.split(/\n(?:参考来源|来源)：/)[0]
    .replace(/^#+ .*$/gm, '')
    .replace(/\[来源[A-H][^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '').match(/[\u3400-\u9fff]/g) || []).length;
};

test('five canonical case chapters meet the requested minimum and remain discoverable exactly once', () => {
  const notes = JSON.parse(read('emba/content/knowledge-index.json')).notes;
  const materials = JSON.parse(read('emba/materials.json')).months.find(m => m.month === '2026-11').materials;
  let total = 0;
  for (let i = 2; i <= 6; i++) {
    const date = `2026-11-0${i}`, file = chapterPath(date), body = read(file);
    const count = countBody(body);
    assert.ok(count >= 2000, `${date}: substantial daily teaching content`);
    assert.match(body, new RegExp(`body_han_characters: ${count}\\b`));
    assert.match(body, /五步学习法|学习五步法/);
    assert.match(body, /教学假设|教学构造|教学示例/);
    assert.match(body, /\[来源[A-H] · PDF第/);
    assert.doesNotMatch(body, /\{\{TOTAL\}\}|This response couldn.t load|ChatGPT said:|ChatGPT is responding/);
    assert.equal(notes.filter(n => n.md_file === '/' + file).length, 1);
    assert.equal(materials.filter(m => m.file === '/' + file).length, 1);
    total += count;
  }
  assert.ok(total >= 20000, `${total} body Han characters; sources/links/headings excluded`);
  assert.ok(read('emba/content/2026/11_November/case-learning/index.md').includes(total.toLocaleString('en-US')));
});

test('daily case entry and resource directory use the existing in-page reader without changing personal notes', () => {
  const month = { month: '2026-11', reflection: 'keep reflection', markdown: 'keep notes', memoryMoment: ['keep photo'], materials: [] };
  const snapshot = JSON.stringify(month);
  const context = vm.createContext({
    document: { getElementById: () => ({ addEventListener() {} }) },
    escapeHtml: v => String(v).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
  });
  vm.runInContext(read('emba/november-study.js'), context);
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    const html = vm.runInContext(`renderNovemberCaseLesson(${i})`, context);
    assert.match(html, new RegExp(`data-material-open="/emba/content/2026/11_November/case-learning/2026-11-0${i + 2}\\.md"`));
    const count = countBody(read(chapterPath(`2026-11-0${i + 2}`)));
    assert.equal(vm.runInContext(`NOVEMBER_CASE_LESSONS[${i}].characters`, context), count);
    sum += count;
  }
  const directory = vm.runInContext('renderNovemberCaseDirectory()', context);
  assert.equal((directory.match(/data-material-open=/g) || []).length, 6);
  assert.ok(directory.includes(sum.toLocaleString('zh-CN')));
  assert.equal(JSON.stringify(month), snapshot);
});

test('older cloud material overlays keep the new teaching chapters and user edits together', () => {
  const context = vm.createContext({
    console,
    document: { body: { classList: { add() {}, remove() {}, toggle() {} } }, cookie: '', querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
    window: { clearTimeout() {}, setTimeout() { return 1; }, location: { origin: 'https://www.turnpo.com' } },
    localStorage: { getItem() { return null; }, setItem() {} },
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    URL, Date, Intl, setTimeout, clearTimeout
  });
  vm.runInContext(read('emba/emba.js'), context);
  const result = vm.runInContext(`mergeMonthData({
    month: '2026-11', materialsRevision: 2,
    materials: [{title:'New chapter', type:'case_learning_guide', file:'/chapter.md'}, {title:'New overview',type:'case_learning_index',file:'/index.md'}]
  }, {
    month: '2026-11', materialsRevision: 9, markdownRevision: 5, reflectionRevision: 4, memoryRevision: 3,
    markdown: 'user notes', reflection: 'user reflection', memoryMoment: [{title:'photo',image:'/private-photo.jpg'}],
    materials: [{title:'User upload',type:'material',file:'/uploaded.pdf'}]
  })`, context);
  assert.deepEqual(Array.from(result.materials, m => m.file), ['/chapter.md', '/index.md', '/uploaded.pdf']);
  assert.equal(result.markdown, 'user notes');
  assert.equal(result.reflection, 'user reflection');
  assert.equal(result.memoryMoment[0].image, '/private-photo.jpg');
});
