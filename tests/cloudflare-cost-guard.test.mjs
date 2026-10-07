import assert from 'node:assert/strict';
import { onRequestGet as mediaGet } from '../functions/api/profiles/[username]/media/[mediaId].js';
import { onRequestPost as profileUpload } from '../functions/api/profiles/[username]/uploads.js';
import { onRequestGet as embaGet } from '../functions/api/emba/file/[[key]].js';
import { onRequestPost as embaUpload } from '../functions/api/emba/upload.js';
import { onRequestGet as eventGet, onRequestPost as eventPost } from '../functions/emba/events/europe-forum-2026/[[asset]].js';
import { hmacHex } from '../functions/_shared/security.js';
import { COST_GUARD_KEY, COST_GUARD_LIMITS } from '../functions/_shared/cost-guard.js';

let assertions = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const expiration = String(Math.floor(Date.now() / 1000) + 600);
const accessSecret = 'synthetic-emba-test-secret';
const accessCookie = `turnpo_emba_access=${expiration}.${await hmacHex(accessSecret, expiration)}`;
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pdf = new TextEncoder().encode('%PDF-1.7 test');

function ledger(mode = 'allow') {
  const reservations = [];
  return {
    reservations,
    prepare() {
      return { bind(...args) {
        reservations.push(args);
        return { async first() {
          if (mode === 'deny') return null;
          if (mode === 'broken') throw new Error('synthetic D1 failure');
          return {
            guard_key: COST_GUARD_KEY,
            cycle_start: args[1],
            class_a_used: args[2],
            class_b_used: args[3],
            upload_bytes_used: args[4],
            storage_bytes_reserved: COST_GUARD_LIMITS.initialStorageBytes + args[4],
            updated_at: args[6],
          };
        } };
      } };
    },
  };
}

function bucket({ error, missing = false, privateObject = false } = {}) {
  const operations = [];
  return {
    operations,
    async get(...args) {
      operations.push(['get', ...args]);
      if (error) throw error;
      if (missing) return null;
      return {
        body: new Uint8Array([1, 2, 3]), size: 3, httpEtag: '"test-etag"',
        writeHttpMetadata(headers) {
          headers.set('content-type', privateObject ? 'application/pdf' : 'image/png');
          headers.set('cache-control', privateObject ? 'private, no-store' : 'public, max-age=31536000, immutable');
          if (privateObject) headers.set('content-disposition', 'inline; filename="original.pdf"');
        },
      };
    },
    async put(...args) { operations.push(['put', ...args]); if (error) throw error; return {}; },
  };
}

function envFor(store, database) {
  const env = {
    PROFILE_MEDIA_R2: store,
    EMBA_BUCKET: store,
    EMBA_ACCESS_CODE: accessSecret,
    TURNPO_AUTH_SECRET: 'synthetic-owner-test-secret',
    AUTH_KV: { async get(key) { return key === 'auth:session:test-owner' ? { profile: 'leo' } : null; } },
  };
  if (database) env.CLOUDFLARE_COST_DB = database;
  return env;
}

function profileRequest({ cookie = 'turnpo_owner_session=test-owner', origin = 'https://turnpo.com', image = png } = {}) {
  return new Request('https://turnpo.com/api/profiles/leo/uploads', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie },
    body: JSON.stringify({ dataUrl: `data:image/png;base64,${Buffer.from(image).toString('base64')}`, filename: 'photo.png' }),
  });
}

function embaUploadRequest({ cookie = accessCookie, origin = 'https://turnpo.com', length } = {}) {
  const data = new FormData();
  data.set('file', new Blob([pdf], { type: 'application/pdf' }), 'original.pdf');
  data.set('month', '2026-10'); data.set('kind', 'material');
  const headers = { Cookie: cookie, Origin: origin };
  if (length) headers['Content-Length'] = String(length);
  return new Request('https://turnpo.com/api/emba/upload', { method: 'POST', headers, body: data });
}

const contexts = [
  ['public media read', (env) => mediaGet({ env, params: { username: 'leo', mediaId: 'ab1234' } })],
  ['private EMBA read', (env) => embaGet({ env, params: { key: ['emba', '2026-10', 'original.pdf'] }, request: new Request('https://turnpo.com/api/emba/file/emba/2026-10/original.pdf', { headers: { Cookie: accessCookie } }) })],
  ['owner image upload', (env) => profileUpload({ env, params: { username: 'leo' }, request: profileRequest() })],
  ['private EMBA upload', (env) => embaUpload({ env, request: embaUploadRequest() })],
  ['protected forum asset read', (env) => eventGet({ env, request: new Request('https://turnpo.com/emba/events/europe-forum-2026/leo-forum-speakers.pdf', { headers: { Cookie: accessCookie } }) })],
];

for (const [name, invoke] of contexts) {
  for (const [mode, status] of [['missing', 503], ['deny', 429], ['broken', 503]]) {
    const store = bucket();
    const db = mode === 'missing' ? null : ledger(mode);
    const response = await invoke(envFor(store, db));
    check(response.status, status);
    check(store.operations.length, 0);
    check(response.headers.get('cache-control'), 'no-store');
  }
  {
    const store = bucket(); const independentAppDb = ledger();
    const env = { ...envFor(store, null), MAPKAI_DB: independentAppDb };
    check((await invoke(env)).status, 503);
    check(store.operations.length, 0); check(independentAppDb.reservations.length, 0);
  }
  const nativeError = new Error(`native R2 failure: ${name}`);
  const store = bucket({ error: nativeError });
  await assert.rejects(invoke(envFor(store, ledger())), (error) => error === nativeError);
  assertions += 1;
}

{
  const store = bucket(); const db = ledger();
  const response = await mediaGet({ env: envFor(store, db), params: { username: 'leo', mediaId: 'ab1234' } });
  check(response.status, 200); check(store.operations[0], ['get', 'profiles/leo/ab1234']);
  check(db.reservations[0].slice(2, 5), [0, 1, 0]);
  check(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  check(response.headers.get('etag'), '"test-etag"');
  check(response.headers.get('content-type'), 'image/png');
  check([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
}
{
  const store = bucket({ privateObject: true }); const db = ledger();
  const response = await contexts[1][1](envFor(store, db));
  check(response.status, 200); check(store.operations[0], ['get', 'emba/2026-10/original.pdf']);
  check(db.reservations[0].slice(2, 5), [0, 1, 0]);
  check(response.headers.get('cache-control'), 'private, no-store');
  check(response.headers.get('content-disposition'), 'inline; filename="original.pdf"');
  check(response.headers.get('content-length'), '3'); check(response.headers.get('etag'), '"test-etag"');
}
{
  const store = bucket(); const db = ledger();
  const response = await contexts[2][1](envFor(store, db)); const payload = await response.json();
  check(response.status, 200); check(db.reservations[0].slice(2, 5), [1, 0, png.byteLength]);
  check([...store.operations[0][2]], [...png]);
  check(store.operations[0][1], `profiles/leo/${payload.mediaId}`);
  check(store.operations[0][3].httpMetadata, { contentType: 'image/png', cacheControl: 'public, max-age=31536000, immutable' });
  check(payload.url, `/api/profiles/leo/media/${payload.mediaId}`);
}
{
  const store = bucket(); const db = ledger();
  const response = await contexts[3][1](envFor(store, db)); const payload = await response.json();
  check(response.status, 200); check(db.reservations[0].slice(2, 5), [1, 0, pdf.byteLength]);
  check([...store.operations[0][2]], [...pdf]); check(store.operations[0][1], payload.key);
  check(store.operations[0][3].httpMetadata, { contentType: 'application/pdf', contentDisposition: 'inline; filename="original.pdf"', cacheControl: 'private, no-store' });
  check(payload.size, pdf.byteLength);
}
{
  const store = bucket({ privateObject: true }); const db = ledger();
  const response = await contexts[4][1](envFor(store, db));
  check(response.status, 200); check(store.operations[0], ['get', 'emba/2026-09/events/europe-forum-2026/20261006/leo-forum-speakers.pdf']);
  check(db.reservations[0].slice(2, 5), [0, 1, 0]);
  check(response.headers.get('content-type'), 'application/pdf');
  check(response.headers.get('cache-control'), 'private, no-store');
  check(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  check(response.headers.get('content-length'), '3');
  assert.ok(response.headers.get('set-cookie').startsWith('turnpo_emba_access=')); assertions += 1;
}

const invalid = [
  [401, (env) => embaGet({ env, params: { key: ['emba', 'private.pdf'] }, request: new Request('https://turnpo.com/api/emba/file/emba/private.pdf') })],
  [400, (env) => embaGet({ env, params: { key: ['outside', 'private.pdf'] }, request: new Request('https://turnpo.com/api/emba/file/outside/private.pdf', { headers: { Cookie: accessCookie } }) })],
  [400, (env) => mediaGet({ env, params: { username: 'leo', mediaId: 'invalid-id' } })],
  [401, (env) => profileUpload({ env, params: { username: 'leo' }, request: profileRequest({ cookie: '' }) })],
  [403, (env) => profileUpload({ env, params: { username: 'cindy' }, request: profileRequest() })],
  [403, (env) => profileUpload({ env, params: { username: 'leo' }, request: profileRequest({ origin: 'https://attacker.example' }) })],
  [413, (env) => profileUpload({ env, params: { username: 'leo' }, request: profileRequest({ image: new Uint8Array(2 * 1024 * 1024 + 1) }) })],
  [401, (env) => embaUpload({ env, request: embaUploadRequest({ cookie: '' }) })],
  [403, (env) => embaUpload({ env, request: embaUploadRequest({ origin: 'https://attacker.example' }) })],
  [413, (env) => embaUpload({ env, request: embaUploadRequest({ length: 64 * 1024 * 1024 + 1 }) })],
];
for (const [status, invoke] of invalid) {
  const store = bucket(); const db = ledger();
  check((await invoke(envFor(store, db))).status, status);
  check(store.operations.length, 0); check(db.reservations.length, 0);
}

for (const [pathname, cookie, status] of [
  ['/emba/events/europe-forum-2026/leo-forum-speakers.pdf', '', 200],
  ['/emba/events/europe-forum-2026/unknown.pdf', accessCookie, 404],
  ['/emba/events/europe-forum-2026', accessCookie, 308],
]) {
  const store = bucket(); const db = ledger();
  const response = await eventGet({ env: envFor(store, db), request: new Request(`https://turnpo.com${pathname}`, { headers: { Cookie: cookie } }) });
  check(response.status, status); check(store.operations.length, 0); check(db.reservations.length, 0);
  if (!cookie) { assert.ok((await response.text()).includes('请输入密码')); assertions += 1; }
}
{
  const store = bucket(); const db = ledger();
  const response = await eventPost({ env: envFor(store, db), request: new Request('https://turnpo.com/emba/events/europe-forum-2026/', { method: 'POST', body: new URLSearchParams({ accessCode: accessSecret }) }) });
  check(response.status, 303); check(response.headers.get('location'), '/emba/events/europe-forum-2026/');
  check(store.operations.length, 0); check(db.reservations.length, 0);
}

for (const [, invoke] of contexts.slice(0, 2)) {
  const store = bucket({ missing: true }); const db = ledger();
  check((await invoke(envFor(store, db))).status, 404);
  check(store.operations.length, 1); check(db.reservations.length, 1);
}

console.log(`Turnpo five-route integration: ${assertions} assertions passed; missing/broken/exhausted ledger blocks all R2, access validation precedes reservations, successful uploads preserve exact bytes and metadata, forum login/download behavior preserved.`);
