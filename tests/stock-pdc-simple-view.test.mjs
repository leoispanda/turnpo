import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(new URL("../stock-pdc/stock-pdc.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../stock-pdc/index.html", import.meta.url), "utf8");
const daily = JSON.parse(fs.readFileSync(new URL("../stock-pdc/daily-top10.json", import.meta.url), "utf8"));
const before = JSON.stringify(daily);
const nodes = new Map();
const context = vm.createContext({document: {querySelector(key) {
  if (!nodes.has(key)) nodes.set(key, {innerHTML: "", value: ""});
  return nodes.get(key);
}}, daily});
vm.runInContext(source.replace(/initAccessGate\(\);\s*$/, ""), context);
vm.runInContext("state.dailyTop10 = daily; renderDashboard();", context);
const panel = nodes.get("#stockSimpleLists");
assert.ok(panel.innerHTML.includes("持有 Top10"));
assert.ok(panel.innerHTML.includes("卖出 Top10"));
assert.ok(panel.innerHTML.includes("未持有"));
assert.ok(panel.innerHTML.includes("待确认"));
assert.ok(!panel.innerHTML.includes("买入"));
assert.ok(!panel.innerHTML.includes("平均分"));
assert.equal(nodes.get("#stockDaySelect").value, daily.latestDate);
assert.equal(vm.runInContext("simpleStockLists(daily.days[0]).target.length", context), 10);
assert.equal(vm.runInContext("simpleStockLists(daily.days[0]).sell.length", context), 10);
assert.equal(JSON.stringify(daily), before);
const selected = daily.days.at(-1).date;
nodes.get("#stockDaySelect").value = selected;
nodes.get("#stockDaySelect").onchange();
assert.ok(panel.innerHTML.includes("当日未记录卖出名单"));
assert.equal(vm.runInContext('simpleStockLists({rows: [], portfolioAdvice: {sell: [], sellWatch: []}}).sell.length', context), 0);
context.sample = {rows: [{ticker: "B", rank: 2}, {ticker: "A", rank: 1}], portfolioAdvice: {
 sell: [{ticker: "X", score: 5}], sellWatch: [{ticker: "X", score: 1}, {ticker: "Y", score: 3}, {ticker: "Z", score: 2}]
}};
assert.equal(vm.runInContext('simpleStockLists(sample).sell.map(row => row.ticker).join(",")', context), "X,Z,Y");
assert.equal(vm.runInContext('simpleStockLists(sample).target[0].ticker', context), "A");
for (const id of ["stockActionPanel", "stockDailyTop10Panel", "stockRankList"]) assert.ok(!html.includes(`id="${id}"`));
assert.ok(!html.includes("生成今日决策"));
assert.ok(html.includes('id="stockDaySelect"'));
console.log("Compact stock view: date selection, target list, sell review, deduplication, empty history and immutable data PASS");
