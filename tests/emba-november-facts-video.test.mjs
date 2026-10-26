import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import factsManifest from '../emba/november-facts-videos.json' with { type: 'json' };
import { factsVideoKey, onRequestGet, onRequestHead } from '../functions/api/emba/video/[date].js';
import { hmacHex } from '../functions/_shared/security.js';
import { COST_GUARD_KEY, COST_GUARD_LIMITS } from '../functions/_shared/cost-guard.js';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const dates = Array.from({ length: 5 }, (_, i) => `2026-11-0${i + 2}`);
const legacyKeys = [
  'emba/2026-11/video/2026-11-02-15b331397161.mp4',
  'emba/2026-11/video/2026-11-03-c62bf17dfd4e.mp4',
  'emba/2026-11/video/2026-11-04-e09526d5ca89.mp4',
  'emba/2026-11/video/2026-11-05-c214cf26e719.mp4',
  'emba/2026-11/video/2026-11-06-56ce85628ac5.mp4'
];
const legacyTitles = ['客户洞察与同理心', '设计思维与团队协作', 'FD案例与人物画像', '战略与商业模式', '战略沟通与整合应用'];
const readyManifest = () => ({
  edition: 'facts', published: true,
  videos: dates.map((date, i) => ({
    date, title: `文章导读 ${i + 1}`, duration: `5:0${i}`,
    notebookUrl: `https://notebook.google.com/notebook/00000000-0000-4000-8000-00000000000${i}`,
    r2Key: `emba/2026-11/video/facts/${date}-${String(i + 1).repeat(12)}.mp4`,
    sha256: String(i + 1).repeat(64), bytes: 64
  }))
});
const secret = 'synthetic-facts-video-test';
const expires = String(Math.floor(Date.now() / 1000) + 600);
const cookie = `turnpo_emba_access=${expires}.${await hmacHex(secret, expires)}`;
const bytes = Uint8Array.from({ length: 64 }, (_, i) => i);

function api({ quota = true } = {}) {
  const calls = [];
  const meta = { size: 64, httpEtag: '"facts-export"', uploaded: new Date('2026-10-26T12:00:00Z') };
  const env = {
    EMBA_ACCESS_CODE: secret,
    EMBA_BUCKET: {
      async head(key) { calls.push(['head', key]); return meta; },
      async get(key, options) {
        calls.push(['get', key, options]); const range = options?.range;
        return { ...meta, body: range ? bytes.slice(range.offset, range.offset + range.length) : bytes };
      }
    },
    CLOUDFLARE_COST_DB: { prepare() { return { bind(...args) { return { async first() {
      if (!quota) return null;
      return { guard_key: COST_GUARD_KEY, cycle_start: args[1], class_a_used: args[2], class_b_used: args[3],
        upload_bytes_used: args[4], storage_bytes_reserved: COST_GUARD_LIMITS.initialStorageBytes + args[4], updated_at: args[6] };
    } }; } }; } }
  };
  return { calls, request(query = '', headers = {}, method = 'GET', date = dates[0]) {
    return { request: new Request(`https://www.turnpo.com/api/emba/video/${date}${query}`, { method, headers: { cookie, ...headers } }), env, params: { date } };
  } };
}

function planner() {
  const listeners = {};
  const month = { month: '2026-11', markdown: 'saved notes', reflection: 'saved reflection', memoryMoment: ['saved photo'], materials: ['saved upload'] };
  const context = vm.createContext({
    document: { getElementById: () => ({ addEventListener(type, fn) { listeners[type] = fn; }, focus() {} }), querySelector: () => ({ focus() {} }) },
    escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
    state: { openBlockId: '', materialReader: null }, selectedMonth: () => month,
    renderMonthDetail() {}, renderOpenBlockPanel: () => '<saved-archive/>', renderMaterialReader: () => '<saved-reader/>'
  });
  const run = code => vm.runInContext(code, context);
  run(read('emba/november-reading-facts.js')); run(read('emba/november-study.js'));
  return { context, month, run, click(index, edition) {
    listeners.click({ target: { closest: selector => selector === '[data-november-video-index]'
      ? { dataset: { novemberVideoIndex: String(index), novemberVideoEdition: edition } } : null }, preventDefault() {}, stopImmediatePropagation() {} });
  } };
}

test('facts edition remains unavailable until a complete verified manifest is published', () => {
  const valid = readyManifest();
  assert.equal(factsVideoKey(dates[0], valid), valid.videos[0].r2Key);
  assert.equal(factsVideoKey('__proto__', valid), '');
  const invalid = [
    { ...valid, published: false }, { ...valid, edition: 'case' }, { ...valid, videos: valid.videos.slice(0, 4) },
    ...['date', 'r2Key', 'sha256', 'notebookUrl', 'duration', 'bytes', 'title'].map(field => {
      const manifest = structuredClone(valid);
      manifest.videos[2][field] = ({ date: dates[0], r2Key: '../unrelated.mp4', sha256: 'unknown',
        notebookUrl: 'https://other.example/notebook', duration: '0:00', bytes: 0, title: '' })[field];
      return manifest;
    }),
    ...['sha256', 'duration', 'notebookUrl'].map(field => {
      const manifest = structuredClone(valid); manifest.videos[0][field] = [manifest.videos[0][field]]; return manifest;
    })
  ];
  for (const manifest of invalid) {
    assert.equal(factsVideoKey(dates[0], manifest), '');
    const app = planner(); app.context.manifest = manifest;
    assert.equal(app.run('normalizeNovemberFactsVideos(manifest).length'), 0);
  }
});

test('the release manifest enables five facts players below their day headings and above article text', () => {
  assert.equal(factsManifest.published, true);
  assert.deepEqual(factsManifest.videos.map(video => video.date), dates);
  assert.deepEqual(factsManifest.videos.map(video => video.duration), ['7:14', '5:48', '6:54', '5:40', '4:52']);
  const app = planner();
  app.context.manifest = factsManifest;
  app.run('NOVEMBER_FACTS_VIDEO_STATE.videos = normalizeNovemberFactsVideos(manifest)');
  assert.equal(app.run('NOVEMBER_FACTS_VIDEO_STATE.videos.length'), 5);
  for (let i = 0; i < 5; i++) {
    assert.equal(factsVideoKey(dates[i]), factsManifest.videos[i].r2Key);
    app.run(`NOVEMBER_STUDY_UI.day=${i}; NOVEMBER_STUDY_UI.module='pre-study'`);
    const html = app.run('renderNovemberStudyModules(selectedMonth())');
    assert.match(html, /Facts 版 · 客观导读视频/);
    assert.match(html, /在 NotebookLM 查看生成记录与来源 ↗/);
    assert.ok(html.includes(`src="/api/emba/video/${dates[i]}?edition=facts"`));
    const headingEnd = html.indexOf('</header>', html.indexOf('data-november-facts>'));
    const videoStart = html.indexOf('<section class="emba-november-video"');
    const videoEnd = html.indexOf('</section>', videoStart) + '</section>'.length;
    const body = html.slice(videoEnd).trimStart();
    assert.ok(headingEnd > 0 && videoStart > headingEnd, `day ${i + 1} player follows its day heading`);
    assert.ok(!html.slice(headingEnd + '</header>'.length, videoStart).trim(), `day ${i + 1} player immediately follows its heading`);
    assert.ok(body.startsWith('<section class="emba-november-fact-article"') || body.startsWith('<p>'), `day ${i + 1} player precedes the facts body`);
  }
});

test('edition selection preserves all old keys and applies auth, range and quota protection to new keys', { concurrency: false }, async () => {
  const original = structuredClone(factsManifest);
  try {
    Object.assign(factsManifest, readyManifest());
    for (let i = 0; i < dates.length; i++) {
      const old = api(); assert.equal((await onRequestHead(old.request('', {}, 'HEAD', dates[i]))).status, 200);
      assert.equal(old.calls[0][1], legacyKeys[i]);
      const current = api();
      const result = await onRequestGet(current.request('?edition=facts', { range: 'bytes=10-19' }, 'GET', dates[i]));
      assert.equal(result.status, 206); assert.equal(current.calls[0][1], factsManifest.videos[i].r2Key);
      assert.equal(result.headers.get('content-range'), 'bytes 10-19/64');
      assert.equal(result.headers.get('cache-control'), 'private, no-store');
      assert.equal(result.headers.get('content-type'), 'video/mp4');
      assert.match(result.headers.get('content-disposition'), /-facts-study-video\.mp4/);
      assert.deepEqual(new Uint8Array(await result.arrayBuffer()), bytes.slice(10, 20));
    }
    for (const query of ['?edition=', '?edition=case', '?edition=unknown', '?edition=__proto__', '?edition=facts&edition=facts']) {
      const f = api(); assert.equal((await onRequestGet(f.request(query))).status, 404); assert.deepEqual(f.calls, []);
    }
    const unauthorized = api(); assert.equal((await onRequestGet(unauthorized.request('?edition=facts', { cookie: '' }))).status, 401);
    assert.deepEqual(unauthorized.calls, []);
    const head = api(); assert.equal((await onRequestHead(head.request('?edition=facts', {}, 'HEAD'))).status, 200);
    assert.deepEqual(head.calls.map(c => c[0]), ['head']);
    const quota = api({ quota: false }); assert.equal((await onRequestGet(quota.request('?edition=facts'))).status, 429); assert.deepEqual(quota.calls, []);
    factsManifest.published = false;
    const pending = api(); assert.equal((await onRequestGet(pending.request('?edition=facts'))).status, 404); assert.deepEqual(pending.calls, []);
    assert.equal((await onRequestGet(pending.request())).status, 200, 'unpublished facts must never break or replace the old export');
  } finally {
    for (const key of Object.keys(factsManifest)) delete factsManifest[key];
    Object.assign(factsManifest, original);
  }
});

test('published facts players appear only in Pre Study; old players and both directory routes remain separate', () => {
  const app = planner(), before = JSON.stringify(app.month);
  app.context.manifest = readyManifest(); app.run('NOVEMBER_FACTS_VIDEO_STATE.videos = normalizeNovemberFactsVideos(manifest)');
  for (let i = 0; i < 5; i++) {
    app.run(`NOVEMBER_STUDY_UI.day=${i}; NOVEMBER_STUDY_UI.module='pre-study'`);
    const current = app.run('renderNovemberStudyModules(selectedMonth())');
    assert.equal((current.match(/<video\b/g) || []).length, 1);
    assert.ok(current.includes(`src="/api/emba/video/${dates[i]}?edition=facts"`));
    assert.match(current, /data-november-facts/); assert.doesNotMatch(current, /五步学习法|原三层讲解|<video[^>]*autoplay/);
    app.run("NOVEMBER_STUDY_UI.module='post-study'");
    const old = app.run('renderNovemberStudyModules(selectedMonth())');
    assert.ok(old.includes(`src="/api/emba/video/${dates[i]}"`)); assert.doesNotMatch(old, /\?edition=facts/);
    assert.ok(old.includes(`<h4 id="november-video-heading-${i}">第 ${i + 1} 天 · ${legacyTitles[i]}</h4>`));
  }
  app.run("NOVEMBER_STUDY_UI.module='resources'");
  const resources = app.run('renderNovemberStudyModules(selectedMonth())');
  assert.equal((resources.match(/data-november-video-index=/g) || []).length, 10);
  assert.match(resources, /Facts 版 · 客观导读视频/); assert.match(resources, /旧案例版/); assert.doesNotMatch(resources, /<video\b/);
  for (let i = 0; i < 5; i++) {
    assert.ok(resources.includes(`data-november-video-edition="case"><span>第 ${i + 1} 天 · ${legacyTitles[i]}</span>`));
  }
  app.context.state.materialReader = { file: 'notes.md' }; app.context.state.openBlockId = 'markdown';
  app.click(2, 'facts'); assert.equal(app.run('NOVEMBER_STUDY_UI.module'), 'pre-study'); assert.equal(app.run('NOVEMBER_STUDY_UI.day'), 2);
  assert.equal(app.context.state.materialReader, null); assert.equal(app.context.state.openBlockId, '');
  app.click(4, 'case'); assert.equal(app.run('NOVEMBER_STUDY_UI.module'), 'post-study'); assert.equal(app.run('NOVEMBER_STUDY_UI.day'), 4);
  app.click(1, 'unknown'); assert.equal(app.run('NOVEMBER_STUDY_UI.day'), 4);
  assert.equal(JSON.stringify(app.month), before);
});

test('facts metadata is fetched once with the existing session and failure leaves the facts text and old edition intact', async () => {
  const app = planner(), calls = [];
  app.context.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => readyManifest() }; };
  await app.run('loadNovemberFactsVideos()'); await app.run('loadNovemberFactsVideos()');
  assert.equal(calls.length, 1); assert.equal(calls[0].url, '/emba/november-facts-videos.json');
  assert.equal(calls[0].options.credentials, 'same-origin'); assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(app.run('NOVEMBER_FACTS_VIDEO_STATE.videos.length'), 5);
  const failed = planner(); failed.context.fetch = async () => { throw new Error('offline'); };
  await failed.run('loadNovemberFactsVideos()');
  assert.equal(failed.run('NOVEMBER_FACTS_VIDEO_STATE.status'), 'error');
  assert.equal(failed.run('NOVEMBER_FACTS_VIDEO_STATE.videos.length'), 0);
  const plain = failed.run('renderNovemberStudyModules(selectedMonth())'); assert.match(plain, /data-november-facts/); assert.doesNotMatch(plain, /<video\b/);
  failed.run("NOVEMBER_STUDY_UI.module='post-study'"); assert.match(failed.run('renderNovemberStudyModules(selectedMonth())'), /<video\b/);
});
