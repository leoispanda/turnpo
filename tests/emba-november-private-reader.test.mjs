import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../emba/november-reading-facts.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../emba/november-study.js', import.meta.url), 'utf8');
const canvasIds = [
  '6794064', '6794094', '6794098', '6794219',
  '6749932',
  '6749945', '6749946', '6749955', '6749949', '6749951', '6749947',
  '6749958', '6749961', '6749964', '6749965',
  '6749970', '6749972', '6749973'
];

function importedManifest() {
  return {
    files: Object.fromEntries(canvasIds.map(id => [id, {
      title: `Original course file ${id}`,
      name: `canvas-${id}.pdf`,
      url: `/api/emba/file/emba/2026-11/material/canvas-${id}.pdf`,
      bytes: 102400,
      pages: 5,
      sha256: 'a'.repeat(64)
    }]))
  };
}

function harness(fetch) {
  const listeners = {};
  const focused = [];
  const scrolled = [];
  let renders = 0;
  const month = {
    id: '2026-11',
    month: '2026-11',
    markdown: 'My saved November notes',
    reflection: 'My saved reflection',
    materials: [{ title: 'Existing course material', file: '/emba/existing.md' }],
    thinkingQuestions: [],
    memoryMoment: [{ title: 'Existing photo', image: '/emba/photo.jpg' }]
  };
  const snapshot = structuredClone(month);
  const detail = { addEventListener(type, listener) { listeners[type] = listener; } };
  const context = vm.createContext({
    document: {
      getElementById(id) {
        return id === 'embaMonthDetail' ? detail : { focus() { focused.push(`#${id}`); } };
      },
      querySelector(selector) { return { focus() { focused.push(selector); } }; }
    },
    escapeHtml: value => String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
    state: { openBlockId: '', materialReader: null },
    selectedMonth: () => month,
    renderMonthDetail: () => renders++,
    renderMaterialReader: () => '<existing-markdown-reader/>',
    renderOpenBlockPanel: () => '<existing-month-archive/>',
    scrollToMonthTarget: selector => scrolled.push(selector),
    ...(fetch ? { fetch: (url, options) => url === '/emba/november-facts-videos.json'
      ? Promise.resolve({ ok: true, json: async () => ({ edition: 'facts', published: false, videos: [] }) })
      : fetch(url, options) } : {})
  });
  vm.runInContext(source, context);
  const run = expression => vm.runInContext(expression, context);
  const click = (selector, dataset = {}) => listeners.click({
    target: { closest: requested => requested === selector ? { dataset, id: 'selected-tab' } : null },
    preventDefault() {},
    stopImmediatePropagation() {}
  });
  return {
    context, month, snapshot, focused, scrolled, run, click,
    render: () => run('renderNovemberStudyModules(selectedMonth())'),
    module: value => click('[data-november-module-select]', { novemberModuleSelect: value }),
    day: value => click('[data-november-day-select]', { novemberDaySelect: String(value) }),
    open: id => click('[data-november-pdf-open]', { novemberPdfOpen: id }),
    close: () => click('[data-november-pdf-close]'),
    escape: () => listeners.keydown({ key: 'Escape', preventDefault() {}, stopImmediatePropagation() {} }),
    importFiles() {
      context.manifest = importedManifest();
      run('NOVEMBER_PRIVATE_FILES.entries = normalizeNovemberManifest(manifest); NOVEMBER_PRIVATE_FILES.status = "loaded";');
    },
    renders: () => renders
  };
}

function privateButtons(html) {
  return [...html.matchAll(/data-november-pdf-open="(\d+)"/g)].map(match => match[1]);
}

test('the manifest accepts known November PDFs and rejects remote, unrelated and unsafe locations', () => {
  const app = harness();
  app.context.manifest = importedManifest();
  assert.deepEqual(
    Object.keys(app.run('normalizeNovemberManifest(manifest)')).sort(),
    [...canvasIds].sort()
  );

  for (const url of [
    'https://other.example/course.pdf',
    '//other.example/course.pdf',
    'javascript:alert(1)',
    '/api/emba/file/emba/2026-09/material/course.pdf',
    '/api/emba/file/emba/2026-11/material/../course.pdf',
    '/api/emba/file/emba/2026-11/material/course.html',
    '/api/emba/file/emba/2026-11/material/course.pdf?redirect=https://other.example/'
  ]) {
    app.context.manifest = { files: { '6794064': { url } } };
    assert.equal(Object.keys(app.run('normalizeNovemberManifest(manifest)')).length, 0, url);
  }
  app.context.manifest = {
    files: { '9999999': { url: '/api/emba/file/emba/2026-11/material/unlisted.pdf' } }
  };
  assert.equal(Object.keys(app.run('normalizeNovemberManifest(manifest)')).length, 0);

  app.context.manifest = {
    files: [{ canvasId: '6794064', url: '/api/emba/file/emba/2026-11/material/one.pdf' }]
  };
  assert.deepEqual(Object.keys(app.run('normalizeNovemberManifest(manifest)')), ['6794064']);
});

test('a successful import exposes all 18 private reader buttons and embeds the selected same-origin PDF', async () => {
  const requests = [];
  const app = harness(async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => importedManifest() };
  });
  await app.run('NOVEMBER_PRIVATE_FILES.promise');
  await app.run('loadNovemberPrivateFiles()');
  assert.equal(requests.length, 1, 'ordinary rerenders must not refetch the manifest');
  assert.equal(requests[0].url, '/emba/november-files.json');
  assert.equal(requests[0].options.credentials, 'same-origin');
  assert.equal(requests[0].options.cache, 'no-store');

  app.module('resources');
  const resources = app.render();
  assert.deepEqual(privateButtons(resources).sort(), [...canvasIds].sort());
  assert.match(resources, /18 份课程原文件已保存至私人 EMBA/);
  assert.equal((resources.match(/Canvas 来源/g) || []).length, 18);
  assert.doesNotMatch(resources, /<details/);

  app.open('6794064');
  const reader = app.render();
  assert.equal((reader.match(/<iframe\b/g) || []).length, 1);
  assert.match(reader, /src="\/api\/emba\/file\/emba\/2026-11\/material\/canvas-6794064\.pdf#view=FitH"/);
  assert.doesNotMatch(reader, /<iframe[^>]+src="https?:/);
  assert.match(reader, /title="Original course file 6794064 · PDF 阅读器"/);
  assert.match(reader, /download="canvas-6794064\.pdf"/);
  assert.match(reader, /data-november-pdf-close/);
  assert.deepEqual(app.scrolled, ['.emba-november-pdf-reader']);
});

test('closing or escaping the PDF restores the selected phase and day without modifying saved content', () => {
  const app = harness();
  app.importFiles();
  for (const [module, day, close] of [
    ['pre-study', 2, () => app.close()],
    ['post-study', 4, () => app.escape()],
    ['resources', 1, () => app.close()]
  ]) {
    app.module(module);
    app.day(day);
    app.open('6749932');
    assert.match(app.render(), /<iframe\b/);
    close();
    assert.equal(app.run('NOVEMBER_STUDY_UI.pdf'), '');
    assert.equal(app.run('NOVEMBER_STUDY_UI.module'), module);
    assert.equal(app.run('NOVEMBER_STUDY_UI.day'), day);
    const restored = app.render();
    assert.doesNotMatch(restored, /<iframe\b/);
    if (module === 'resources') assert.equal(privateButtons(restored).length, 18);
    else assert.match(restored, new RegExp(`data-november-${module === 'pre-study' ? 'pre' : 'post'}-day="2026-11-0${day + 2}"`));
    assert.equal(app.focused.at(-1), '[data-november-pdf-open="6749932"]');
  }
  assert.deepEqual(app.month, app.snapshot);
});

test('the existing Markdown reader and monthly archive still render before and after PDF use', () => {
  const app = harness();
  app.importFiles();
  for (const module of ['pre-study', 'post-study', 'resources']) {
    app.module(module);
    app.context.state.materialReader = { file: 'saved-notes.md' };
    assert.match(app.render(), /<existing-markdown-reader\/>/);
    assert.doesNotMatch(app.render(), /<iframe\b/);
    app.context.state.materialReader = null;
  }
  app.open('6749970');
  app.close();
  app.context.state.materialReader = { file: 'november-plan.md' };
  assert.match(app.render(), /<existing-markdown-reader\/>/);
  app.context.state.materialReader = null;
  app.module('post-study');
  app.context.state.openBlockId = 'markdown';
  assert.match(app.render(), /<existing-month-archive\/>/);
  assert.deepEqual(app.month, app.snapshot);
});

test('a failed manifest request offers retry and claims an import only after a successful retry', async () => {
  let attempts = 0;
  const app = harness(async () => {
    attempts++;
    if (attempts === 1) throw new Error('Network unavailable');
    return { ok: true, json: async () => importedManifest() };
  });
  await app.run('NOVEMBER_PRIVATE_FILES.promise');
  app.module('resources');
  const failed = app.render();
  assert.equal(app.run('NOVEMBER_PRIVATE_FILES.status'), 'error');
  assert.equal(privateButtons(failed).length, 0);
  assert.match(failed, /data-november-files-retry/);
  assert.doesNotMatch(failed, /18 份课程原文件已保存|可直接在本页阅读/);

  app.click('[data-november-files-retry]');
  await app.run('NOVEMBER_PRIVATE_FILES.promise');
  assert.equal(attempts, 2);
  assert.equal(app.run('NOVEMBER_PRIVATE_FILES.status'), 'loaded');
  assert.equal(privateButtons(app.render()).length, 18);
  assert.match(app.render(), /18 份课程原文件已保存至私人 EMBA/);
  assert.deepEqual(app.month, app.snapshot);
});
