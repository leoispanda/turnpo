// Every controlled Worker and upload tool must bind the same D1 database.
// These conservative account allowances leave room for provider rounding and
// operations outside this gateway. They are usage limits, not a euro invoice cap.
export const COST_GUARD_LIMITS = Object.freeze({
  classA: 100_000,
  classB: 8_000_000,
  uploadBytes: 512 * 1024 * 1024,
  storageBytes: 8 * 1024 * 1024 * 1024,
  initialStorageBytes: 3 * 1024 * 1024 * 1024,
  cycleDayUTC: 7,
});

export const COST_GUARD_KEY = 'cloudflare-account-r2-v1';

export const COST_GUARD_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS cloudflare_cost_guard (
  guard_key TEXT PRIMARY KEY NOT NULL,
  cycle_start TEXT NOT NULL,
  class_a_used INTEGER NOT NULL CHECK (class_a_used >= 0),
  class_b_used INTEGER NOT NULL CHECK (class_b_used >= 0),
  upload_bytes_used INTEGER NOT NULL CHECK (upload_bytes_used >= 0),
  storage_bytes_reserved INTEGER NOT NULL CHECK (storage_bytes_reserved >= 0),
  updated_at INTEGER NOT NULL
)`;

// One statement makes checking and reserving indivisible across Workers.
// Counters reset only when a later billing period starts. The persistent storage
// reservation survives resets, failed uploads, overwrites, and deletions.
export const COST_GUARD_RESERVATION_SQL = `
INSERT INTO cloudflare_cost_guard (
  guard_key, cycle_start, class_a_used, class_b_used,
  upload_bytes_used, storage_bytes_reserved, updated_at
)
SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7
WHERE ?3 <= ?8 AND ?4 <= ?9 AND ?5 <= ?10 AND ?6 <= ?11
ON CONFLICT (guard_key) DO UPDATE SET
  cycle_start = excluded.cycle_start,
  class_a_used = CASE
    WHEN cloudflare_cost_guard.cycle_start = excluded.cycle_start
    THEN cloudflare_cost_guard.class_a_used ELSE 0 END + excluded.class_a_used,
  class_b_used = CASE
    WHEN cloudflare_cost_guard.cycle_start = excluded.cycle_start
    THEN cloudflare_cost_guard.class_b_used ELSE 0 END + excluded.class_b_used,
  upload_bytes_used = CASE
    WHEN cloudflare_cost_guard.cycle_start = excluded.cycle_start
    THEN cloudflare_cost_guard.upload_bytes_used ELSE 0 END + excluded.upload_bytes_used,
  storage_bytes_reserved = cloudflare_cost_guard.storage_bytes_reserved + ?12,
  updated_at = MAX(cloudflare_cost_guard.updated_at, excluded.updated_at)
WHERE cloudflare_cost_guard.cycle_start <= excluded.cycle_start
  AND (CASE WHEN cloudflare_cost_guard.cycle_start = excluded.cycle_start
    THEN cloudflare_cost_guard.class_a_used ELSE 0 END + excluded.class_a_used) <= ?8
  AND (CASE WHEN cloudflare_cost_guard.cycle_start = excluded.cycle_start
    THEN cloudflare_cost_guard.class_b_used ELSE 0 END + excluded.class_b_used) <= ?9
  AND (CASE WHEN cloudflare_cost_guard.cycle_start = excluded.cycle_start
    THEN cloudflare_cost_guard.upload_bytes_used ELSE 0 END + excluded.upload_bytes_used) <= ?10
  AND (cloudflare_cost_guard.storage_bytes_reserved + ?12) <= ?11
RETURNING guard_key, cycle_start, class_a_used, class_b_used,
  upload_bytes_used, storage_bytes_reserved, updated_at
`;

export class CostGuardError extends Error {
  constructor(code, status) {
    super(status === 429
      ? 'Media usage has reached its limit. Please try again later.'
      : 'Media is temporarily unavailable. Please try again later.');
    this.name = 'CostGuardError';
    this.code = code;
    this.status = status;
  }
}

const unavailable = () => new CostGuardError('COST_GUARD_UNAVAILABLE', 503);
const exhausted = () => new CostGuardError('COST_GUARD_EXHAUSTED', 429);
const unsupported = () => new CostGuardError('COST_GUARD_UNSUPPORTED_WRITE', 503);

export function billingCycleStart(now = Date.now()) {
  const date = new Date(now);
  if (!Number.isSafeInteger(date.getTime())) throw unavailable();
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth();
  if (year < 2000 || year > 9998) throw unavailable();
  if (date.getUTCDate() < COST_GUARD_LIMITS.cycleDayUTC) {
    month -= 1;
    if (month < 0) { year -= 1; month = 11; }
  }
  return new Date(Date.UTC(year, month, COST_GUARD_LIMITS.cycleDayUTC)).toISOString().slice(0, 10);
}

export function resolveCostDatabase(env) {
  // A dedicated, explicit shared binding prevents an application DB fallback
  // from accidentally granting each project an independent account quota.
  const database = env?.CLOUDFLARE_COST_DB;
  if (!database || typeof database.prepare !== 'function') throw unavailable();
  return database;
}

function reservationAmounts(operation, bytes) {
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw unsupported();
  if (!['get', 'head', 'list', 'put'].includes(operation)) throw unsupported();
  if (operation !== 'put' && bytes !== 0) throw unsupported();
  if (bytes > COST_GUARD_LIMITS.uploadBytes) throw exhausted();
  return {
    classA: operation === 'list' || operation === 'put' ? 1 : 0,
    classB: operation === 'get' || operation === 'head' ? 1 : 0,
    uploadBytes: operation === 'put' ? bytes : 0,
  };
}

function validReservation(row, cycleStart) {
  const fields = [
    ['class_a_used', COST_GUARD_LIMITS.classA],
    ['class_b_used', COST_GUARD_LIMITS.classB],
    ['upload_bytes_used', COST_GUARD_LIMITS.uploadBytes],
    ['storage_bytes_reserved', COST_GUARD_LIMITS.storageBytes],
  ];
  return row?.guard_key === COST_GUARD_KEY && row?.cycle_start === cycleStart
    && Number.isSafeInteger(row.updated_at)
    && fields.every(([key, maximum]) => Number.isSafeInteger(row[key]) && row[key] >= 0 && row[key] <= maximum)
    && row.storage_bytes_reserved >= COST_GUARD_LIMITS.initialStorageBytes;
}

export async function reserveR2Usage(env, operation, { bytes = 0, now = Date.now() } = {}) {
  const database = resolveCostDatabase(env);
  const amounts = reservationAmounts(operation, bytes);
  const cycleStart = billingCycleStart(now);
  const timestamp = new Date(now).getTime();
  const bindings = [
    COST_GUARD_KEY, cycleStart, amounts.classA, amounts.classB,
    amounts.uploadBytes, COST_GUARD_LIMITS.initialStorageBytes + amounts.uploadBytes, timestamp,
    COST_GUARD_LIMITS.classA, COST_GUARD_LIMITS.classB,
    COST_GUARD_LIMITS.uploadBytes, COST_GUARD_LIMITS.storageBytes, amounts.uploadBytes,
  ];
  let row;
  try {
    row = await database.prepare(COST_GUARD_RESERVATION_SQL).bind(...bindings).first();
  } catch {
    // Never return a provider's error text, SQL, binding values, or credentials.
    throw unavailable();
  }
  if (row === null || row === undefined) throw exhausted();
  if (!validReservation(row, cycleStart)) throw unavailable();
  return row;
}

function knownPutValue(value) {
  try {
    // Snapshot buffers before awaiting D1 so a caller cannot resize or change
    // the upload between the byte reservation and the actual R2 operation.
    if (typeof value === 'string') {
      const data = new TextEncoder().encode(value);
      return { data, bytes: data.byteLength };
    }
    if (value === null) return { data: null, bytes: 0 };
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      const bytes = value.byteLength;
      if (!Number.isSafeInteger(bytes) || bytes < 0) throw unsupported();
      if (bytes > COST_GUARD_LIMITS.uploadBytes) throw exhausted();
      const data = value instanceof ArrayBuffer
        ? new Uint8Array(value).slice()
        : new Uint8Array(value.buffer, value.byteOffset, bytes).slice();
      return { data, bytes: data.byteLength };
    }
    if (typeof Blob !== 'undefined' && value instanceof Blob) {
      const data = Blob.prototype.slice.call(value);
      return { data, bytes: data.size };
    }
  } catch (error) {
    if (error instanceof CostGuardError) throw error;
    throw unsupported();
  }
  // ReadableStream, custom objects, and multipart uploads have no validated
  // byte count here. Reject instead of silently omitting a storage reservation.
  throw unsupported();
}

export function wrapR2Bucket(bucket, env, { now = Date.now } = {}) {
  if (!bucket || typeof now !== 'function') throw unavailable();
  const invoke = async (operation, args, bytes = 0) => {
    if (typeof bucket[operation] !== 'function') throw unavailable();
    let timestamp;
    try { timestamp = now(); } catch { throw unavailable(); }
    await reserveR2Usage(env, operation, { bytes, now: timestamp });
    // An attempted R2 operation is never refunded, including a failed call.
    return bucket[operation](...args);
  };
  return Object.freeze({
    get: (...args) => invoke('get', args),
    head: (...args) => invoke('head', args),
    list: (...args) => invoke('list', args),
    put: (key, value, options) => {
      const { data, bytes } = knownPutValue(value);
      return invoke('put', [key, data, options], bytes);
    },
    delete: (...args) => {
      if (typeof bucket.delete !== 'function') throw unavailable();
      // Delete is free, but releasing reserved bytes needs an authoritative
      // storage audit. A failed or repeated delete cannot grant storage quota.
      return bucket.delete(...args);
    },
    createMultipartUpload: () => { throw unsupported(); },
    resumeMultipartUpload: () => { throw unsupported(); },
  });
}

export function costResponse(error) {
  if (!(error instanceof CostGuardError)) return null;
  const guarded = error;
  return new Response(JSON.stringify({ error: guarded.message }), {
    status: guarded.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
