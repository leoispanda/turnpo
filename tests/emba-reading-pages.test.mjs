import assert from "node:assert/strict";
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("emba/reading-data.json", "utf8"));
const html = fs.readFileSync("emba/reading.html", "utf8");
const script = fs.readFileSync("emba/reading.js", "utf8");
const styles = fs.readFileSync("emba/reading.css", "utf8");
const learningPathHtml = fs.readFileSync("emba/learning-path.html", "utf8");
const learningPathScript = fs.readFileSync("emba/learning-path.js", "utf8");
const learningPathStyles = fs.readFileSync("emba/learning-path.css", "utf8");
const originalHtml = fs.readFileSync("emba/original-reading.html", "utf8");
const originalScript = fs.readFileSync("emba/original-reading.js", "utf8");
const originalStyles = fs.readFileSync("emba/original-reading.css", "utf8");
const fullReadingIndex = JSON.parse(fs.readFileSync("emba/reading-texts/index.json", "utf8"));
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
assert.equal(fullReadingIndex.readings.length, 12, "Twelve complete course readings should have extracted full text");
assert.ok(fullReadingIndex.readings.reduce((total, item) => total + item.paragraphCount, 0) >= 850, "Full readings should contain at least 850 readable sections");
for (const entry of fullReadingIndex.readings) {
  const path = `emba/reading-texts/${entry.id}.json`;
  assert.ok(fs.existsSync(path), `${entry.id} full-reading file is missing`);
  const fullReading = JSON.parse(fs.readFileSync(path, "utf8"));
  assert.equal(fullReading.paragraphs.length, entry.paragraphCount, `${entry.id} paragraph count does not match the index`);
  assert.ok(fullReading.paragraphs.every((item) => item.label && item.en && item.page), `${entry.id} contains an incomplete original paragraph`);
}

const stulzFullText = JSON.parse(fs.readFileSync("emba/reading-texts/stulz-risk-management.json", "utf8"));
const stulzPageOne = stulzFullText.paragraphs
  .filter((item) => item.pdfPage === 1)
  .map((item) => item.en)
  .join(" ");
const stulzPageTwo = stulzFullText.paragraphs
  .filter((item) => item.pdfPage === 2)
  .map((item) => item.en)
  .join(" ");
assert.match(stulzPageOne, /^This article explores an apparent conflict between the theory and current practice/);
assert.ok(
  stulzPageOne.indexOf("The actual corporate use of derivatives")
    < stulzPageOne.indexOf("What the stories suggest, and the surveys seem to confirm"),
  "Stulz page 1 must keep the left column before the right column",
);
assert.doesNotMatch(stulzPageOne, /apparent conflict T between/);
assert.doesNotMatch(stulzPageTwo, /1\. Christopher Culp and Merton Miller/);

const dayContent = dayFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const dayOne = fs.readFileSync(dayFiles[0], "utf8");
const dayTwo = fs.readFileSync(dayFiles[1], "utf8");
const dayOneLearningPath = "emba/materials/2026-09/reflections/2026-09-07-day-1-financial-management-leo-learning-path.md";
const berkReading = data.readings.find((item) => item.id === "berk-corporate-finance");
assert.ok(berkReading?.fable, "Berk should have a knowledge fable before the study guide");
assert.equal(berkReading.fable.title, "《一盏晚到的灯》");
assert.ok(berkReading.fable.paragraphs.length >= 4, "Berk fable should have a complete narrative arc");
assert.equal(berkReading.parts.length, 7, "Berk should follow the seven substantive blocks found in the fourth-edition summary");
assert.equal(berkReading.partsHeading, "沿着第四版摘要实际出现的顺序读");
assert.match(berkReading.parts.map((part) => part.title).join(" "), /Ch\. 4.*Ch\. 7.*Ch\. 8.*Ch\. 9.*Chs\. 11–12.*Ch\. 14.*Chs\. 20–22/);
assert.ok(fs.existsSync(dayOneLearningPath), "Day 1 needs Leo's reusable learning path");
const dayOneReflection = fs.readFileSync(dayOneLearningPath, "utf8");
assert.match(dayOne, /北辰号/);
assert.match(dayOne, /灯火号/);
assert.match(dayOne, /有货的盾，才叫保护；没有货的盾，就是赌博/);
assert.match(dayOne, /一条从未走过的路，不算退路/);
assert.match(dayOne, /Invest \/ stage \/ delay \/ reject/);
assert.match(dayOne, /我的学习路径｜把 Day 1 变成可反复返回的判断/);
assert.match(dayOne, /\/emba\/learning-path\.html/);
assert.match(dayOneReflection, /先用 90 秒回到这一天/);
assert.match(dayOneReflection, /有货的盾，才叫保护；没有货的盾，就是赌博/);
assert.match(dayOneReflection, /不要做情绪上的主人翁，要做职业上的负责人/);
assert.match(dayOneReflection, /好的决策系统不只是产生答案，而是管理承诺的时机/);
assert.match(dayOneReflection, /如果我只有…/);
assert.match(dayTwo, /那张干净的检查表/);
assert.match(dayTwo, /The Clean Checklist/);
assert.match(dayTwo, /真正的合规，不是每天都打勾/);
assert.match(dayTwo, /问题从哪里来/);
assert.match(dayTwo, /red lights/);
assert.match(dayTwo, /Double materiality/);
for (const file of dayFiles) {
  const markdown = fs.readFileSync(file, "utf8");
  const firstPart = markdown.split("## 第二部分｜")[0];
  assert.match(firstPart, /### 知识寓言｜/i, `${file} needs one focused concept fable`);
  assert.match(firstPart, /### 今天真正要学会的判断/, `${file} needs a plain-language learning judgment`);
  assert.match(firstPart, /### Syllabus 边界｜今天学什么，不学什么/, `${file} needs an explicit syllabus boundary`);
  assert.match(firstPart, /### 五步知识链｜/, `${file} needs a five-step decision chain`);
  assert.match(firstPart, /我怎样带你/, `${file} needs a guided, conversational learning path`);
  assert.deepEqual(
    [...firstPart.matchAll(/^#### (0[1-5])｜/gm)].map((match) => match[1]),
    ["01", "02", "03", "04", "05"],
    `${file} must contain exactly five ordered learning steps`,
  );
  assert.doesNotMatch(firstPart, /\*\*要回答：\*\*|\*\*完成标志：\*\*/, `${file} should teach through explanation, not question prompts`);
  assert.match(firstPart, /### 寓言对应｜/, `${file} needs a fable map`);
  assert.match(firstPart, /### 类比边界/, `${file} needs a non-trivial analogy boundary`);
  assert.match(firstPart, /### 应用到自己的公司｜完成一张/, `${file} needs one applied decision card`);
}
for (const reading of data.readings) {
  assert.match(dayContent, new RegExp(`reading\\.html\\?reading=${reading.id}`), `${reading.id} is not linked from a day page`);
}

assert.match(html, /id="readingApp"/);
assert.match(script, /沿着文章结构逐部分读/);
assert.match(script, /阅读完整原文/);
assert.match(script, /original-reading\.html\?reading=/);
assert.match(script, /Before the formulas · 知识寓言/);
assert.match(script, /reading\.partsHeading/);
assert.match(script, /target="_blank"/);
assert.match(styles, /\.reading-keywords/);
assert.match(styles, /\.reading-fable/);
assert.doesNotMatch(script, /<details class="reading-excerpt">/);
assert.match(originalHtml, /id="originalReadingApp"/);
assert.match(originalScript, /data-original-paragraph/);
assert.match(originalScript, /aria-pressed/);
assert.match(originalScript, /点击任意段落，该段会原位生成并切换成中文/);
assert.match(originalScript, /reading-texts\/index\.json/);
assert.match(originalScript, /translate\.googleapis\.com/);
assert.match(originalStyles, /\.original-paragraph\[aria-pressed="true"\]/);
assert.match(originalStyles, /\.original-text-zh/);
assert.match(learningPathHtml, /id="learningPathApp"/);
assert.match(learningPathHtml, /\/emba\/reading\.css/);
assert.match(learningPathHtml, /data-learning-back/);
assert.match(learningPathScript, /2026-09-07-day-1-financial-management-leo-learning-path\.md/);
assert.match(learningPathScript, /window\.history\.back/);
assert.match(learningPathScript, /learning-stations/);
assert.match(learningPathStyles, /\.learning-layout/);
assert.match(learningPathStyles, /\.learning-side/);

console.log("EMBA reading page checks passed");
