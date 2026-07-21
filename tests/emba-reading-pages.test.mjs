import assert from "node:assert/strict";
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("emba/reading-data.json", "utf8"));
const html = fs.readFileSync("emba/reading.html", "utf8");
const script = fs.readFileSync("emba/reading.js", "utf8");
const styles = fs.readFileSync("emba/reading.css", "utf8");
const dayFiles = [
  "emba/materials/2026-09/days/2026-09-07-financial-management.md",
  "emba/materials/2026-09/days/2026-09-08-compliance-sustainability.md",
  "emba/materials/2026-09/days/2026-09-09-accounting-erm-governance.md",
  "emba/materials/2026-09/days/2026-09-10-management-control.md",
  "emba/materials/2026-09/days/2026-09-11-financial-management-integration.md"
];

assert.equal(data.readings.length, 16, "The syllabus requires exactly 16 readings");
assert.equal(new Set(data.readings.map((item) => item.id)).size, 16, "Reading ids must be unique");
assert.deepEqual([...new Set(data.readings.map((item) => item.day))], ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"]);
assert.equal(data.readings.filter((item) => item.status === "source-available").length, 12, "Exactly 12 required originals are locally available");
assert.equal(data.readings.filter((item) => item.status !== "source-available").length, 4, "Exactly four readings need substitute study guides");

for (const reading of data.readings) {
  assert.ok(reading.summary.length <= 300, `${reading.id} quick summary exceeds 300 characters`);
  assert.ok(reading.summary.length >= 70, `${reading.id} quick summary is too thin`);
  assert.ok(reading.parts.length >= 4, `${reading.id} needs at least four deep-reading parts`);
  assert.ok(reading.keywords.length >= 5, `${reading.id} needs at least five keywords`);
  assert.ok(reading.keywords.every((item) => item.term && item.ipa && item.zh && item.meaning), `${reading.id} has an incomplete keyword`);
  assert.ok(reading.originalNote, `${reading.id} needs an original-reading status note`);
  assert.ok(Array.isArray(reading.excerpts), `${reading.id} excerpts must be an array`);
  assert.ok(reading.excerpts.every((item) => item.label && item.en && item.zh), `${reading.id} has an incomplete translated excerpt`);
  if (reading.sourceUrl?.startsWith("/")) {
    assert.ok(fs.existsSync(`.${decodeURI(reading.sourceUrl)}`), `${reading.id} source file is missing`);
  }
}

assert.equal(data.readings.filter((item) => item.excerpts.length >= 2).length, 11, "Eleven text-based originals should have translated excerpts");
assert.equal(data.readings.reduce((total, item) => total + item.excerpts.length, 0), 32, "The original-reading section should contain 32 checked excerpts");

const dayContent = dayFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
for (const reading of data.readings) {
  assert.match(dayContent, new RegExp(`reading\\.html\\?reading=${reading.id}`), `${reading.id} is not linked from a day page`);
}

assert.match(html, /id="readingApp"/);
assert.match(script, /沿着文章结构逐部分读/);
assert.match(script, /点击段落展开中文翻译/);
assert.match(script, /<details class="reading-excerpt">/);
assert.match(script, /target="_blank"/);
assert.match(styles, /\.reading-keywords/);
assert.match(styles, /\.reading-excerpt\[open\]/);

console.log("EMBA reading page checks passed");
