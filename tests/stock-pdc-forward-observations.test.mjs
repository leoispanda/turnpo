import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../stock-pdc/stock-pdc.js', import.meta.url), 'utf8');
const panels = new Map();
const ctx = vm.createContext({document:{querySelector:key=>{if(!panels.has(key))panels.set(key,{innerHTML:''});return panels.get(key);}}});
vm.runInContext(source.replace(/initAccessGate\(\);\s*$/, ''), ctx);
ctx.day = {date:'2026-10-09',kind:'DAILY_TOP10',rows:[{ticker:'AAA',name:'原股票',rank:1,signalDayChangePct:99,dayChangePct:88,changeType:'NEW'}]};
ctx.feed = {methodId:'signal_close_to_next_market_session_close_v1',cohorts:{'2026-10-09':{signalDate:'2026-10-09',returnDate:'2026-10-12',status:'OBSERVED',rows:[{ticker:'AAA',rank:1,status:'OBSERVED',closeToClosePct:-2,openToClosePct:-1}],summary:{selectedCount:1,observedCount:1,equalWeightMeanPct:-2,benchmarkPct:1,excessPctPoints:-3,positiveCount:0,openToCloseMeanPct:-1}}}};
vm.runInContext("state.data={latestDate:'2026-10-12',selectionFollowUp:feed}; state.dailyTop10={days:[day]};",ctx);
const html=vm.runInContext('renderRankCell(day,1)',ctx);
assert.ok(html.includes('-2.00%'));
assert.ok(html.includes('2026-10-12'));
assert.ok(html.includes('stock-price-negative'));
assert.ok(!html.includes('99.00%'));
assert.ok(!html.includes('88.00%'));
vm.runInContext('renderSelectionFollowUpPanel()',ctx);
const panel=panels.get('#stockSelectionFollowUpPanel').innerHTML;
assert.ok(panel.includes('2026-10-09 选入 → 2026-10-12 验证'));
assert.ok(panel.includes('-3.00 个百分点'));
assert.ok(panel.includes('0 / 1'));
vm.runInContext("feed.cohorts['2026-10-09'].rows[0].status='PRICE_BASIS_MISMATCH';",ctx);
assert.ok(vm.runInContext('renderRankCell(day,1)',ctx).includes('口径待核'));
vm.runInContext("feed.cohorts['2026-10-09'].rows[0].ticker='NEW_STOCK';",ctx);
assert.ok(!vm.runInContext('renderRankCell(day,1)',ctx).includes('-2.00%'));
vm.runInContext("state.data.selectionFollowUp=null;",ctx);
assert.ok(vm.runInContext('renderRankCell(day,1)',ctx).includes('数据缺失'));
ctx.today={date:'2026-10-12',kind:'DAILY_TOP10',rows:ctx.day.rows};
assert.ok(vm.runInContext('renderRankCell(today,1)',ctx).includes('待验证'));
ctx.legacy={...ctx.day,kind:'HISTORICAL',portfolio:{returnDate:'2026-10-12'}};
vm.runInContext("state.data.portfolio={method:'equal_weight_top20_next_trading_day_close_to_close'};",ctx);
assert.ok(vm.runInContext('renderRankCell(legacy,1)',ctx).includes('88.00%'));
ctx.legacy.portfolio.returnDate='2026-10-09';
assert.ok(!vm.runInContext('renderRankCell(legacy,1)',ctx).includes('88.00%'));
const canonical=JSON.parse(fs.readFileSync(new URL('../stock-pdc/daily-top10.json',import.meta.url),'utf8'));
const historical=JSON.parse(fs.readFileSync(new URL('../stock-pdc/rank-flow.json',import.meta.url),'utf8'));
ctx.canonical=canonical;ctx.historical=historical;
vm.runInContext('state.data=mergeDailyTop10IntoRankFlow(historical,canonical);',ctx);
const actual=JSON.parse(vm.runInContext('JSON.stringify(selectionHistorySummary(state.data.days))',ctx));
if(canonical.selectionHistoryFollowUp?.historySummary){
  for(const expected of canonical.selectionHistoryFollowUp.historySummary.groups){
    const group=actual.find(item=>item.group===expected.group);
    assert.equal(group.complete,expected.completeDates);
    assert.equal(group.dates,expected.totalDates);
    assert.equal(group.paired,expected.benchmarkPairedDates);
    assert.equal(group.outperform,expected.outperformDates);
    assert.equal(group.selections,expected.observedSelections);
    assert.ok(Math.abs(group.mean-expected.meanNextSessionPct)<0.000001);
  }
  vm.runInContext('renderSelectionHistoryPanel()',ctx);
  const historyPanel=panels.get('#stockSelectionHistoryPanel').innerHTML;
  assert.equal((historyPanel.match(/<tr>/g)||[]).length,stateDays(canonical,historical)+1);
  assert.ok(historyPanel.includes('未拼接成连续复利收益'));
  assert.ok(historyPanel.includes('发布早于验证日尚未逐期核实'));
}
function stateDays(canonical,historical){return new Set([...canonical.days,...historical.days].map(day=>day.date)).size;}

// A one-stock winning day and a twenty-stock losing day get equal weight.
const fixtureDays=['2026-09-28','2026-09-29','2026-09-30'].map(date=>({date,sourceFile:'local-v3/fixture/07_portfolio_review/portfolio_shortlist.csv',rows:[{ticker:'AAA',rank:1}]}));
fixtureDays[1].rows=Array.from({length:20},(_,i)=>({ticker:`T${i}`,rank:i+1}));
ctx.fixtureDays=fixtureDays;
vm.runInContext(`state.data={latestDate:'2026-10-12',days:fixtureDays,selectionFollowUp:{methodId:'signal_close_to_next_market_session_close_v1',cohorts:{}}};
for (const [i,day] of fixtureDays.entries()) state.data.selectionFollowUp.cohorts[day.date]={signalDate:day.date,returnDate:'2026-10-09',status:i===2?'INCOMPLETE':'OBSERVED',rows:day.rows.map(row=>({...row,status:i===2?'MISSING_PRICE':'OBSERVED',closeToClosePct:i===0?10:-10})),summary:{selectedCount:day.rows.length,equalWeightMeanPct:i===0?10:-10,benchmarkPct:i===0?2:null,excessPctPoints:i===0?8:null,positiveCount:i===0?1:0}};`,ctx);
const fixtureSummary=JSON.parse(vm.runInContext('JSON.stringify(selectionHistorySummary(fixtureDays)[0])',ctx));
assert.equal(fixtureSummary.mean,0);
assert.equal(fixtureSummary.excess,8);
assert.equal(fixtureSummary.complete,2);
assert.equal(fixtureSummary.incomplete,1);
assert.equal(fixtureSummary.paired,1);
console.log('Stock PDC forward observations and historical summary checks passed');
