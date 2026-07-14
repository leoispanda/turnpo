import assert from "node:assert/strict";
import fs from "node:fs";

const rankFlow = JSON.parse(fs.readFileSync(new URL("../stock-pdc/rank-flow.json", import.meta.url), "utf8"));
const abFlow = JSON.parse(fs.readFileSync(new URL("../stock-pdc/ab-flow.json", import.meta.url), "utf8"));
const syncScript = fs.readFileSync(new URL("../scripts/sync-stock-pdc-rank-flow.mjs", import.meta.url), "utf8");

assert.equal(abFlow.schemaVersion, "stock-pdc-ab-v1");
assert.equal(abFlow.availability, "ACTIVE");
assert.deepEqual(abFlow.validationErrors, []);
assert.equal(abFlow.latestDate, rankFlow.latestDate);
assert.equal(abFlow.experiment.status, "active_prospective");
assert.equal(abFlow.experiment.noBackfill, true);
assert.equal(abFlow.experiment.priceMode, "public_tencent_unadjusted_fail_closed");
assert.equal(abFlow.runStatus.latestSignalDate, abFlow.latestDate);
assert.equal(abFlow.latestSignal.date, abFlow.latestDate);
assert.equal(abFlow.latestSignal.snapshotId, abFlow.runStatus.latestSnapshotId);

const rows = abFlow.latestSignal.rows;
const expectedGroups = ["A_PORTFOLIO", "A_SELECTION", "B_PORTFOLIO", "B_SELECTION"];
assert.deepEqual([...new Set(rows.map((row) => row.strategy_id))].sort(), expectedGroups);
expectedGroups.forEach((group) => {
  const total = rows
    .filter((row) => row.strategy_id === group)
    .reduce((sum, row) => sum + (row.target_weight_pct || 0), 0);
  if (group.endsWith("_SELECTION")) assert.ok(Math.abs(total - 100) <= 0.001);
  if (group.endsWith("_PORTFOLIO")) assert.ok(total <= 100.0001);
});

assert.equal(abFlow.summary.experimentStatus, abFlow.experiment.status);
assert.equal(abFlow.summary.effectiveSignalDate, abFlow.experiment.effectiveSignalDate);
assert.equal(abFlow.summary.minimumPairedTradingDays, 60);
assert.ok(abFlow.summary.tracks.selection.A);
assert.ok(abFlow.summary.tracks.selection.B);
assert.ok(abFlow.summary.tracks.portfolio.A);
assert.ok(abFlow.summary.tracks.portfolio.B);
const comparisonLastDate = abFlow.comparison.map((row) => row.valuation_date).sort().at(-1);
assert.equal(comparisonLastDate, abFlow.summary.lastValuationDate);
assert.ok(syncScript.includes("ab-flow.json"));

console.log("Stock PDC A/B flow static checks passed");
