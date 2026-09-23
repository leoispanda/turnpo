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
assert.ok(actionHtml.includes("下一交易日持仓建议"));
assert.ok(actionHtml.includes("候选观察"));
assert.ok(!actionHtml.includes("通过完整 PDC 买入闸门"));
for (const row of daily.actions.rows) {
  assert.ok(actionHtml.includes(row.name || row.ticker));
}
assert.equal(vm.runInContext('actionRows("REVIEW").length', context), daily.actions.counts.review);
assert.equal(vm.runInContext('portfolioActionGroups().hold.length', context), daily.portfolioAdvice.hold.length + daily.portfolioAdvice.sellWatch.length);
assert.equal(vm.runInContext('portfolioActionGroups().sell.length', context), daily.portfolioAdvice.sell.length);
const readyBuys = daily.portfolioAdvice.new.filter(row => row.action === "BUY" && row.entryReadiness === "REVIEWED" && row.scenarioStatus === "SCENARIO_PASS");
assert.equal(vm.runInContext('portfolioActionGroups().watch.length', context), daily.portfolioAdvice.new.length - readyBuys.length);
assert.equal(vm.runInContext('portfolioActionGroups().buy.length', context), readyBuys.length);
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
context.membershipRow = { name: "测试", ticker: "TEST", rank: 1, changeType: "NEW", isHeld: true };
const newHeld = vm.runInContext('renderRankCell({date:"2099-01-05",rows:[membershipRow]},1)', context);
assert.ok(newHeld.includes('class="stock-new-badge">NEW</span>'));
assert.ok(newHeld.includes('class="stock-held-badge">持仓</span>'));
context.membershipRow = { ...context.membershipRow, changeType: "UP", isHeld: false };
const retainedCandidate = vm.runInContext('renderRankCell({date:"2099-01-05",rows:[membershipRow]},1)', context);
assert.ok(!retainedCandidate.includes('class="stock-new-badge"'));
assert.ok(!retainedCandidate.includes('class="stock-held-badge"'));

context.actionFixture = {
  latestDate: "2099-01-05", days: [{ date: "2099-01-05", rows: [], portfolioAdvice: {
    hold: [{ ticker: "H", name: "持有股" }],
    sellWatch: [{ ticker: "W", name: "观察持仓", action: "SELL" }],
    sell: [{ ticker: "S", name: "退出股", action: "SELL" }],
    new: [{ ticker: "N", name: "仅新上榜", action: "BUY" },
          { ticker: "B", name: "已过门槛", action: "BUY", entryReadiness: "REVIEWED", scenarioStatus: "SCENARIO_PASS" }],
    dataReview: [{ ticker: "D", name: "缺持仓资料" }]
  } }], actions: { latestDate: "2099-01-05", counts: { sell: 99 }, rows: [] }
};
vm.runInContext('state.data = actionFixture; renderDashboard();', context);
assert.equal(vm.runInContext('portfolioActionGroups().hold.map(row => row.ticker).join(",")', context), "H,W");
assert.equal(vm.runInContext('portfolioActionGroups().sell.map(row => row.ticker).join(",")', context), "S");
assert.equal(vm.runInContext('portfolioActionGroups().buy.map(row => row.ticker).join(",")', context), "B");
assert.equal(vm.runInContext('portfolioActionGroups().watch.map(row => row.ticker).join(",")', context), "N");
assert.equal(vm.runInContext('portfolioActionGroups().dataReview.length', context), 1);
assert.ok(panels.get("#stockActionPanel").innerHTML.includes("缺持仓资料"));
vm.runInContext('state.data = { latestDate:"2099-01-06", days:[{date:"2099-01-06",rows:[]}], actions:actionFixture.actions }; renderActionPanel();', context);
assert.equal(vm.runInContext('portfolioActionGroups()', context), null);
assert.ok(panels.get("#stockActionPanel").innerHTML.includes("完整持仓建议尚未生成"));
context.emptyDaily = { ...daily, latestDate: "2099-01-05", days: [{ date: "2099-01-05", rows: [] }] };
vm.runInContext("state.data = mergeDailyTop10IntoRankFlow(historic, emptyDaily); renderRankList();", context);
assert.ok(panels.get("#stockRankList").innerHTML.includes("2099-01-05"));
assert.equal(vm.runInContext("visibleDays()[0].rows.length", context), 0);
context.newer = { ...historic, latestDate: "2099-01-05", days: [{ date: "2099-01-05", rows: [{ rank: 1 }] }], actions: { latestDate: "2099-01-05", rows: [] } };
assert.equal(vm.runInContext("mergeDailyTop10IntoRankFlow(newer, daily).actions.latestDate", context), "2099-01-05");
console.log("Stock PDC delivery display checks passed");
