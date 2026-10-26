import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { onRequestGet, onRequestHead } from '../functions/api/emba/video/[date].js';
import { hmacHex } from '../functions/_shared/security.js';
import { COST_GUARD_KEY, COST_GUARD_LIMITS } from '../functions/_shared/cost-guard.js';

const secret = 'synthetic-private-video-test';
const expires = String(Math.floor(Date.now() / 1000) + 600);
const cookie = `turnpo_emba_access=${expires}.${await hmacHex(secret, expires)}`;
const bytes = Uint8Array.from({ length: 64 }, (_, i) => i);
function fixture({ quota = true, missing = false } = {}) {
  const calls = [];
  const meta = { size: bytes.length, httpEtag: '"immutable-video"', uploaded: new Date('2026-10-21T12:00:00Z') };
  const env = {
    EMBA_ACCESS_CODE: secret,
    EMBA_BUCKET: {
      async head(key) { calls.push(['head', key]); return missing ? null : meta; },
      async get(key, options) {
        calls.push(['get', key, options]);
        const range = options?.range;
        return { ...meta, body: range ? bytes.slice(range.offset, range.offset + range.length) : bytes };
      }
    },
    CLOUDFLARE_COST_DB: { prepare() { return { bind(...args) { return { async first() {
      if (!quota) return null;
      return { guard_key: COST_GUARD_KEY, cycle_start: args[1], class_a_used: args[2],
        class_b_used: args[3], upload_bytes_used: args[4],
        storage_bytes_reserved: COST_GUARD_LIMITS.initialStorageBytes + args[4], updated_at: args[6] };
    } }; } }; } }
  };
  const request = (headers = {}, method = 'GET', date = '2026-11-02') => ({
    request: new Request(`https://www.turnpo.com/api/emba/video/${date}`, { method, headers: { cookie, ...headers } }),
    env, params: { date }
  });
  return { calls, env, request };
}

test('video access requires the existing EMBA login and accepts only the five published dates', async () => {
  const f = fixture();
  assert.equal((await onRequestGet(f.request({ cookie: '' }))).status, 401);
  for (const date of ['2026-09-07', '__proto__', '../material/private.pdf']) {
    assert.equal((await onRequestGet(f.request({}, 'GET', date))).status, 404);
  }
  assert.deepEqual(f.calls, []);
});

test('full GET and HEAD preserve private video headers; HEAD does not read the body', async () => {
  const f = fixture();
  const response = await onRequestGet(f.request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'video/mp4');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.equal(response.headers.get('content-length'), '64');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  f.calls.length = 0;
  const head = await onRequestHead(f.request({ range: 'bytes=0-1' }, 'HEAD'));
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), '64');
  assert.equal(await head.text(), '');
  assert.deepEqual(f.calls.map(c => c[0]), ['head']);
});

test('bounded, open-ended, suffix and clamped ranges return the requested video bytes', async () => {
  for (const [range, first, last] of [['bytes=10-19', 10, 19], ['bytes=60-', 60, 63], ['bytes=-8', 56, 63], ['bytes=60-999', 60, 63]]) {
    const f = fixture();
    const response = await onRequestGet(f.request({ range }));
    assert.equal(response.status, 206, range);
    assert.equal(response.headers.get('content-range'), `bytes ${first}-${last}/64`);
    assert.equal(response.headers.get('content-length'), String(last - first + 1));
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes.slice(first, last + 1));
  }
});

test('invalid or unsatisfiable ranges do not fetch a body; If-Range mismatch returns a full response', async () => {
  for (const range of ['bytes=64-', 'bytes=9-3', 'bytes=-0', 'bytes=0-1,4-5', 'bytes=-', 'bytes=9007199254740992-']) {
    const f = fixture();
    const response = await onRequestGet(f.request({ range }));
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('content-range'), 'bytes */64');
    assert.deepEqual(f.calls.map(c => c[0]), ['head']);
  }
  for (const [ifRange, status] of [['"old-video"', 200], ['"immutable-video"', 206], ['Wed, 21 Oct 2026 12:00:00 GMT', 206]]) {
    assert.equal((await onRequestGet(fixture().request({ range: 'bytes=0-1', 'if-range': ifRange }))).status, status);
  }
});

test('shared quota guard fails closed and missing videos return 404', async () => {
  const denied = fixture({ quota: false });
  assert.equal((await onRequestGet(denied.request())).status, 429);
  assert.deepEqual(denied.calls, []);
  const missing = fixture({ missing: true });
  assert.equal((await onRequestGet(missing.request())).status, 404);
});

test('Post Study keeps each private player while facts-only Pre Study and resources omit the old video directory', () => {
  const listeners = {};
  const month = { month: '2026-11', markdown: 'saved notes', reflection: 'saved reflection', materials: [] };
  const before = JSON.stringify(month);
  const context = vm.createContext({
    document: { getElementById: () => ({ addEventListener(type, fn) { listeners[type] = fn; }, focus() {} }), querySelector: () => ({ focus() {} }) },
    escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
    state: { openBlockId: '', materialReader: null }, selectedMonth: () => month,
    renderMonthDetail() {}, renderOpenBlockPanel: () => '', renderMaterialReader: () => ''
  });
  const run = code => vm.runInContext(code, context);
  run(fs.readFileSync(new URL('../emba/november-reading-facts.js', import.meta.url), 'utf8'));
  run(fs.readFileSync(new URL('../emba/november-study.js', import.meta.url), 'utf8'));
  for (let i = 0; i < 5; i++) {
    for (const module of ['pre-study', 'post-study']) {
      run(`NOVEMBER_STUDY_UI.day=${i}; NOVEMBER_STUDY_UI.module='${module}'`);
      const html = run('renderNovemberStudyModules(selectedMonth())');
      assert.equal((html.match(/<video\b/g) || []).length, module === 'post-study' ? 1 : 0);
      if (module === 'post-study') assert.match(html, new RegExp(`src="/api/emba/video/2026-11-0${i + 2}"`));
      assert.doesNotMatch(html, /<video[^>]*autoplay/);
    }
  }
  run('NOVEMBER_STUDY_UI.module="resources"');
  assert.equal((run('renderNovemberStudyModules(selectedMonth())').match(/data-november-video-index=/g) || []).length, 0);
  listeners.click({ target: { closest: selector => selector === '[data-november-video-index]' ? { dataset: { novemberVideoIndex: '3' } } : null }, preventDefault() {}, stopImmediatePropagation() {} });
  assert.equal(run('NOVEMBER_STUDY_UI.module'), 'post-study');
  assert.equal(run('NOVEMBER_STUDY_UI.day'), 3);
  assert.equal(JSON.stringify(month), before);
});
