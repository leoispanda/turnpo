import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const base = '/emba/content/2026/11_November/';
const materials = JSON.parse(read('emba/materials.json')).months.find(m => m.month === '2026-11');
const notes = JSON.parse(read('emba/content/knowledge-index.json')).notes;
const manifest = JSON.parse(read('emba/november-files.json'));
const previous = [base + 'case-learning/index.md', ...Array.from({length: 5}, (_, i) => {
  const date = `2026-11-0${i + 2}`;
  return [base + `case-learning/${date}.md`, ...['foundation', 'detailed', 'seminar'].map(level => base + `pre-study/${date}-${level}.md`)];
}).flat()];

function planner() {
  const context = vm.createContext({
    document: { getElementById() { return { addEventListener() {} }; } },
    escapeHtml: value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
    state: { openBlockId: '', materialReader: null },
    renderMaterialReader: () => '<reader/>', renderOpenBlockPanel: () => '<archive/>'
  });
  vm.runInContext(read('emba/november-reading-facts.js') + '\n' + read('emba/november-study.js'), context);
  const run = code => vm.runInContext(code, context);
  context.manifest = manifest;
  run('NOVEMBER_PRIVATE_FILES.entries = normalizeNovemberManifest(manifest); NOVEMBER_PRIVATE_FILES.status = "loaded"');
  return { context, run, data: JSON.parse(run('JSON.stringify(NOVEMBER_READING_FACTS)')) };
}

function library() {
  const context = vm.createContext({
    console,
    document: { body: { classList: { add() {}, remove() {}, toggle() {} } }, cookie: '', querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
    window: { clearTimeout() {}, setTimeout() { return 1; }, location: { origin: 'https://www.turnpo.com' } },
    localStorage: { getItem() { return null; }, setItem() {} },
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    URL, Date, Intl, setTimeout, clearTimeout
  });
  vm.runInContext(read('emba/emba.js'), context);
  return { context, run: code => vm.runInContext(code, context) };
}

test('all five Pre Study days render plain introductions with every original PDF covered', () => {
  const app = planner();
  assert.equal(app.data.days.length, 5);
  const pdfIds = [];
  for (let i = 0; i < 5; i++) {
    const html = app.run(`renderNovemberPreDay(NOVEMBER_STUDY_DAYS[${i}], ${i})`);
    assert.match(html, /data-november-facts/);
    assert.doesNotMatch(html, /<details\b|<video\b|五步学习法|建议练习|专家研讨|原三层讲解|新版 · 案例教学|data-november-guide/);
    if (i < 3) {
      const ids = [...html.matchAll(/data-november-pdf-open="(\d+)"/g)].map(m => m[1]);
      assert.equal(ids.length, [1, 3, 14][i]);
      pdfIds.push(...ids);
    }
    if (i === 3) {
      assert.match(html, /没有另列新的核心文章/);
      assert.equal((html.match(/原课程视频 ↗/g) || []).length, 2);
      assert.ok(app.data.days[i].articles.every(key => app.data.articles[key].kind === 'video'));
    }
    if (i === 4) {
      assert.match(html, /没有另列第五篇核心文章/);
      assert.equal(app.data.days[i].articles.length, 0);
      assert.equal(app.data.days[i].paragraphs.length, 5);
    }
  }
  assert.deepEqual(pdfIds.sort(), Object.keys(manifest.files).sort());
  const resources = app.run('renderNovemberResources({materials: []})');
  assert.equal((resources.match(/data-november-pdf-open=/g) || []).length, 18);
  assert.equal((resources.match(/data-material-open="[^\"]*pre-study-facts/g) || []).length, 5);
  assert.doesNotMatch(resources, /case-learning\/|pre-study\/2026|data-november-video-index|原三层讲解/);
});

test('daily reader notes and on-page introductions share the same prose and unique active metadata', () => {
  const { data } = planner();
  for (const day of data.days) {
    const markdown = read(day.file.slice(1));
    for (const key of day.articles) {
      const article = data.articles[key];
      assert.ok(markdown.includes(article.title), article.title);
      for (const paragraph of article.paragraphs) assert.ok(markdown.includes(paragraph), article.title);
      for (const source of article.sources || []) assert.equal(source.url, manifest.files[source.id].url);
    }
    for (const paragraph of day.paragraphs || []) assert.ok(markdown.includes(paragraph));
  }
  const current = [...data.days.map(day => day.file), base + 'pre-study-facts/index.md'];
  for (const file of current) {
    assert.equal(materials.materials.filter(item => item.file === file).length, 1, file);
    const matches = notes.filter(note => note.md_file === file);
    assert.equal(matches.length, 1, file);
    assert.equal(matches[0].status, 'active');
    assert.equal(matches[0].rag_include, true);
    assert.match(read(file.slice(1)), /status: "active"/);
  }
  const html = read('emba/index.html');
  assert.ok(html.indexOf('src="/emba/november-reading-facts.js?') < html.indexOf('src="/emba/november-study.js?'));
});

test('old guides stay archived while unrelated materials and active facts remain discoverable', () => {
  const app = library();
  assert.equal(previous.length, 21);
  for (const file of previous) {
    const note = notes.find(note => note.md_file === file);
    assert.equal(note.status, 'archived', file);
    assert.equal(note.rag_include, false, file);
    assert.match(read(file.slice(1)), /status: archived/);
    assert.equal(app.run(`materialHasContent({file:${JSON.stringify(file)}})`), false);
  }
  for (const file of [base + 'pre-study-facts/2026-11-02.md', '/emba/content/2026/09_September/case-learning/index.md', '/api/emba/file/user-upload.pdf']) {
    assert.equal(app.run(`materialHasContent({file:${JSON.stringify(file)}})`), true, file);
  }
  app.context.sourceNotes = notes;
  app.run('state.knowledge.notes = sourceNotes.map(normalizeKnowledgeNote); state.knowledge.filters.query = ""');
  assert.equal(app.run('filteredKnowledgeNotes().length'), 0);
  app.run('state.knowledge.filters.query = "pre-study"');
  assert.ok(app.run('filteredKnowledgeNotes().length') > 0);
  assert.equal(app.run('filteredKnowledgeNotes().some(note => note.status === "archived")'), false);
});

test('higher-revision older cloud lists preserve the six new facts entries and all personal edits', () => {
  const app = library();
  app.context.baseMonth = materials;
  app.context.oldPaths = previous;
  const result = app.run(`mergeMonthData(baseMonth, {
    month: '2026-11', materialsRevision: 9999, markdownRevision: 9999, reflectionRevision: 9999, memoryRevision: 9999,
    markdown: 'saved personal notes', reflection: 'saved personal reflection',
    memoryMoment: [{title:'saved photo', image:'/private-photo.jpg'}],
    materials: [{title:'My PDF', type:'material', file:'/api/emba/file/my-upload.pdf'}, ...oldPaths.map(file => ({title:'Old guide', file}))]
  })`);
  const paths = Array.from(result.materials, item => item.file);
  assert.equal(paths.filter(file => file.includes('/pre-study-facts/')).length, 6);
  assert.equal(paths.filter(file => previous.includes(file)).length, 0);
  assert.ok(paths.includes('/api/emba/file/my-upload.pdf'));
  assert.equal(result.markdown, 'saved personal notes');
  assert.equal(result.reflection, 'saved personal reflection');
  assert.equal(result.memoryMoment[0].image, '/private-photo.jpg');
});
