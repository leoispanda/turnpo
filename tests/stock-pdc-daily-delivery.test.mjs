import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../stock-pdc/stock-pdc.js", import.meta.url), "utf8");
const daily = JSON.parse(fs.readFileSync(new URL("../stock-pdc/daily-top10.json", import.meta.url), "utf8"));
const historic = JSON.parse(fs.readFileSync(new URL("../stock-pdc/rank-flow.json", import.meta.url), "utf8"));
const panels = new Map();
const context = vm.createContext({ document: { querySelector: (key) => {
  if (!panels.has(key)) panels.set(key, { innerHTML: "" });
  return panels.get(key);
} } });
vm.runInContext(source.replace(/initAccessGate\(\);\s*$/, ""), context);
context.daily = daily;
context.historic = historic;
vm.runInContext(`
  state.dailyTop10 = daily;
  state.data = mergeDailyTop10IntoRankFlow(historic, daily);
  renderActionPanel();
  renderDailyTop10Panel();
`, context);
assert.equal(vm.runInContext("state.data.actions.latestDate", context), daily.latestDate);
assert.equal(vm.runInContext("state.data.verification.runId", context), daily.source.runId);
for (const day of historic.days) {
  assert.ok(vm.runInContext("state.data.days.some(day => day.date === " + JSON.stringify(day.date) + ")", context));
}
const actionHtml = panels.get("#stockActionPanel").innerHTML;
assert.ok(actionHtml.includes(daily.latestDate));
assert.ok(actionHtml.includes("新增观察 / 待复核"));
assert.ok(!actionHtml.includes("通过完整 PDC 买入闸门"));
for (const row of daily.actions.rows) {
  assert.ok(actionHtml.includes(row.name || row.ticker));
}
assert.equal(vm.runInContext('actionRows("REVIEW").length', context), daily.actions.counts.review);
const dailyHtml = panels.get("#stockDailyTop10Panel").innerHTML;
assert.ok(dailyHtml.includes(daily.verification.v3QualityStatus));
assert.ok(dailyHtml.includes("仓位待复核"));
assert.ok(!dailyHtml.includes("目标仓位 0.00%"));
vm.runInContext("renderRankList();", context);
const rankHtml = panels.get("#stockRankList").innerHTML;
assert.ok(rankHtml.includes(daily.latestDate));
for (const row of daily.days.find(day => day.date === daily.latestDate).rows) {
  assert.ok(rankHtml.includes(row.name || row.ticker));
}
context.emptyDaily = { ...daily, latestDate: "2099-01-05", days: [{ date: "2099-01-05", rows: [] }] };
vm.runInContext("state.data = mergeDailyTop10IntoRankFlow(historic, emptyDaily); renderRankList();", context);
assert.ok(panels.get("#stockRankList").innerHTML.includes("2099-01-05"));
assert.equal(vm.runInContext("visibleDays()[0].rows.length", context), 0);
context.newer = { ...historic, latestDate: "2099-01-05", days: [{ date: "2099-01-05", rows: [{ rank: 1 }] }], actions: { latestDate: "2099-01-05", rows: [] } };
assert.equal(vm.runInContext("mergeDailyTop10IntoRankFlow(newer, daily).actions.latestDate", context), "2099-01-05");
console.log("Stock PDC delivery display checks passed");
