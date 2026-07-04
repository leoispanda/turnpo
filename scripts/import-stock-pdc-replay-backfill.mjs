import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TURNPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_DIR = path.join(TURNPO_ROOT, "stock-pdc", "backfill", "daily_watchlists");
const WATCHLIST_HEADERS = [
  "run_date",
  "ticker",
  "rank",
  "final_score",
  "final_status",
  "market_regime_score",
  "trend_score",
  "livermore_breakout_score",
  "volume_price_score",
  "candlestick_score",
  "overheat_score",
  "risk_score",
  "zhuge_orion_score",
  "final_chair_score",
  "main_reason",
  "main_risk",
  "suggested_action_status",
  "analysis_date",
  "front_desk_instruction"
];

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        value += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers = [], ...body] = rows;
  return body
    .filter((cells) => cells.some((cell) => String(cell || "").trim()))
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])));
}

function clean(value) {
  return String(value ?? "").trim();
}

function intOrMax(value) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : 999;
}

function csvValue(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function watchlistRow(row, index) {
  const date = clean(row.signal_date);
  const rank = clean(row.pdc_rank) || clean(row.recommendation_rank) || String(index + 1);
  const instruction = clean(row.instruction);

  return {
    run_date: date,
    ticker: clean(row.ticker),
    rank,
    final_score: clean(row.final_score),
    final_status: clean(row.final_status),
    market_regime_score: clean(row.market_regime_score),
    trend_score: clean(row.trend_score),
    livermore_breakout_score: clean(row.livermore_breakout_score),
    volume_price_score: clean(row.volume_price_score),
    candlestick_score: clean(row.candlestick_score),
    overheat_score: clean(row.overheat_score),
    risk_score: clean(row.risk_score),
    zhuge_orion_score: clean(row.zhuge_orion_score),
    final_chair_score: clean(row.final_chair_score),
    main_reason: instruction,
    main_risk: clean(row.main_risk),
    suggested_action_status: instruction,
    analysis_date: date,
    front_desk_instruction: instruction
  };
}

const inputPath = path.resolve(argValue("--input"));
const outputDir = path.resolve(argValue("--output-dir", DEFAULT_OUTPUT_DIR));
const requestedDates = new Set(
  argValue("--dates")
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean)
);

if (!inputPath || !fs.existsSync(inputPath)) {
  console.error("Missing replay CSV. Usage: node scripts/import-stock-pdc-replay-backfill.mjs --input daily_replay_trades.csv --dates 2026-06-25,2026-06-30");
  process.exit(1);
}

const replayRows = parseCsv(fs.readFileSync(inputPath, "utf8"));
const grouped = new Map();

replayRows.forEach((row) => {
  const date = clean(row.signal_date);
  if (!date || (requestedDates.size && !requestedDates.has(date))) return;
  if (!grouped.has(date)) grouped.set(date, []);
  grouped.get(date).push(row);
});

fs.mkdirSync(outputDir, { recursive: true });

Array.from(grouped.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([date, rows]) => {
    const normalized = rows
      .sort((a, b) => intOrMax(a.recommendation_rank || a.pdc_rank) - intOrMax(b.recommendation_rank || b.pdc_rank))
      .slice(0, 20)
      .map((row, index) => watchlistRow(row, index));
    const lines = [
      WATCHLIST_HEADERS.join(","),
      ...normalized.map((row) => WATCHLIST_HEADERS.map((header) => csvValue(row[header])).join(","))
    ];
    const outputPath = path.join(outputDir, `watchlist_${date}.csv`);
    fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
    console.log(`Wrote ${outputPath} (${normalized.length} rows)`);
  });

const missingDates = Array.from(requestedDates).filter((date) => !grouped.has(date));
if (missingDates.length) {
  console.error(`No replay rows found for: ${missingDates.join(", ")}`);
  process.exitCode = 1;
}
