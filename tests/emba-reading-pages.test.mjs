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
  if (reading.sourceUrl?.startsWith("/")) {
    assert.ok(fs.existsSync(`.${decodeURI(reading.sourceUrl)}`), `${reading.id} source file is missing`);
  }
}

const dayContent = dayFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
for (const reading of data.readings) {
  assert.match(dayContent, new RegExp(`reading\\.html\\?reading=${reading.id}`), `${reading.id} is not linked from a day page`);
}

assert.match(html, /id="readingApp"/);
assert.match(script, /沿着文章结构逐部分读/);
assert.match(script, /target="_blank"/);
assert.match(styles, /\.reading-keywords/);

console.log("EMBA reading page checks passed");
