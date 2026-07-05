import assert from "node:assert/strict";
import fs from "node:fs";

const embaJs = fs.readFileSync(new URL("../emba/emba.js", import.meta.url), "utf8");
const embaHtml = fs.readFileSync(new URL("../emba/index.html", import.meta.url), "utf8");
const embaReadme = fs.readFileSync(new URL("../emba/README.md", import.meta.url), "utf8");
const embaFunction = fs.readFileSync(new URL("../functions/emba/[[path]].js", import.meta.url), "utf8");
const embaApiUtils = fs.readFileSync(new URL("../functions/api/emba/_utils.js", import.meta.url), "utf8");
const embaLibraryApi = fs.readFileSync(new URL("../functions/api/emba/library.js", import.meta.url), "utf8");
const embaUploadApi = fs.readFileSync(new URL("../functions/api/emba/upload.js", import.meta.url), "utf8");
const embaFileApi = fs.readFileSync(new URL("../functions/api/emba/file/[[key]].js", import.meta.url), "utf8");

assert.ok(embaJs.includes('const EMBA_LIBRARY_API = "/api/emba/library";'));
assert.ok(embaJs.includes('const EMBA_UPLOAD_API = "/api/emba/upload";'));
assert.ok(embaJs.includes("uploadEmbaFile(file, month.month, \"memory\")"));
assert.ok(embaJs.includes("uploadEmbaFile(file, month.month, \"material\")"));
assert.ok(embaJs.includes("libraryForCloud"));
assert.ok(embaJs.includes("emba-single-memory"));
assert.ok(!embaJs.includes("Photo title"));
assert.ok(!embaJs.includes('placeholder="Caption"'));
assert.ok(embaHtml.includes('id="embaSyncStatus"'));

assert.ok(embaFunction.includes('accessCookie(token, path = "/")'));
assert.ok(embaFunction.includes('clearAccessCookie(path = "/")'));
assert.ok(embaFunction.includes("appendClearCookies"));

assert.ok(embaApiUtils.includes("turnpo_emba_access"));
assert.ok(embaApiUtils.includes("validateSameOriginRequest"));
assert.ok(embaApiUtils.includes("validR2Key"));
assert.ok(embaApiUtils.includes("data:"));
assert.ok(embaApiUtils.includes("MAX_MEMORIES_PER_MONTH = 1"));

assert.ok(embaLibraryApi.includes("env.EMBA_DB"));
assert.ok(embaLibraryApi.includes("CREATE TABLE IF NOT EXISTS emba_state"));
assert.ok(embaLibraryApi.includes("ON CONFLICT(key) DO UPDATE"));

assert.ok(embaUploadApi.includes("env.EMBA_BUCKET"));
assert.ok(embaUploadApi.includes("request.formData()"));
assert.ok(embaUploadApi.includes("fileUrlFromKey(key)"));

assert.ok(embaFileApi.includes("env.EMBA_BUCKET.get(key)"));
assert.ok(embaFileApi.includes("requireEmbaAccess"));
assert.ok(embaFileApi.includes("writeHttpMetadata"));

assert.ok(embaReadme.includes("D1 database binding name: EMBA_DB"));
assert.ok(embaReadme.includes("R2 bucket binding name: EMBA_BUCKET"));

console.log("EMBA cloud static checks passed");
