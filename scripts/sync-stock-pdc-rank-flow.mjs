import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TURNPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_ROOT = "/Users/leoyang/Documents/financial freedom/stock-pdc-local";
const OUTPUT_PATH = path.join(TURNPO_ROOT, "stock-pdc", "rank-flow.json");
const BACKFILL_WATCHLIST_DIR = path.join(TURNPO_ROOT, "stock-pdc", "backfill", "daily_watchlists");
const SCORE_FIELDS = [
  "market_regime_score",
  "trend_score",
  "livermore_breakout_score",
  "volume_price_score",
  "candlestick_score",
  "overheat_score",
  "risk_score",
  "zhuge_orion_score",
  "final_chair_score"
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

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function listCsvFiles(dir, prefix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((file) => file.startsWith(prefix) && file.endsWith(".csv"))
    .sort()
    .map((file) => path.join(dir, file));
}

function collectWatchlistFiles(sourceRoot) {
  const sourceWatchlistDir = path.join(sourceRoot, "outputs", "daily_watchlists");
  const sources = [
    { dir: sourceWatchlistDir, root: sourceRoot, label: "source" },
    { dir: BACKFILL_WATCHLIST_DIR, root: TURNPO_ROOT, label: "turnpo-backfill" }
  ];
  const byDate = new Map();

  sources.forEach((source) => {
    listCsvFiles(source.dir, "watchlist").forEach((filePath) => {
      const date = dateFromFile(filePath, "watchlist");
      if (!date) return;
      byDate.set(date, {
        date,
        filePath,
        root: source.root,
        label: source.label
      });
    });
  });

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function dateFromFile(filePath, prefix) {
  const match = path.basename(filePath).match(new RegExp(`^${prefix}_(\\d{4}-\\d{2}-\\d{2})\\.csv$`));
  return match ? match[1] : "";
}

function numberOrNull(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function intOrNull(value) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function clean(value) {
  return String(value ?? "").trim();
}

function scoreMap(row) {
  return Object.fromEntries(SCORE_FIELDS.map((field) => [field, numberOrNull(row[field])]));
}

function loadNames(sourceRoot) {
  const candidates = [
    path.join(sourceRoot, "outputs_a_share", "a_share_universe.csv"),
    path.join(sourceRoot, "outputs_a_share", "a_share_universe_with_mcap.csv"),
    path.join(sourceRoot, "outputs_a_share_live_mcap", "a_share_universe.csv"),
    path.join(sourceRoot, "outputs", "leaderboard_changes_history.csv"),
    path.join(sourceRoot, "outputs_a_share_latest_runs")
  ];
  const names = new Map();

  candidates.forEach((candidate) => {
    if (!fs.existsSync(candidate)) return;
    if (fs.statSync(candidate).isDirectory()) {
      fs.readdirSync(candidate)
        .filter((entry) => entry.startsWith("run_"))
        .sort()
        .forEach((entry) => {
          const filePath = path.join(candidate, entry, "a_share_universe.csv");
          if (fs.existsSync(filePath)) {
            readCsv(filePath).forEach((row) => {
              if (row.ticker && row.name) names.set(row.ticker, row.name);
            });
          }
        });
      return;
    }
    readCsv(candidate).forEach((row) => {
      if (row.ticker && row.name) names.set(row.ticker, row.name);
    });
  });

  return names;
}

function changeFromRanks(currentRank, previousRank) {
  if (!previousRank) return "NEW";
  if (currentRank < previousRank) return "UP";
  if (currentRank > previousRank) return "DOWN";
  return "UNCHANGED";
}

function rankDelta(currentRank, previousRank) {
  if (!currentRank || !previousRank) return null;
  return previousRank - currentRank;
}

function movementText(type, delta) {
  if (type === "NEW") return "新晋";
  if (type === "DROPPED") return "退出";
  if (type === "UP") return `上升 ${Math.abs(delta || 0)}`;
  if (type === "DOWN") return `下降 ${Math.abs(delta || 0)}`;
  return "保持";
}

function normalizeWatchRow(row, date, previousByTicker, changesByTicker, names) {
  const ticker = clean(row.ticker);
  const currentRank = intOrNull(row.rank);
  const changed = changesByTicker.get(ticker);
  const previousRank = intOrNull(changed?.previous_rank) || previousByTicker.get(ticker)?.rank || null;
  const changeType = clean(changed?.change_type) || changeFromRanks(currentRank, previousRank);
  const delta = intOrNull(changed?.rank_delta) ?? rankDelta(currentRank, previousRank);
  const name = clean(changed?.name) || names.get(ticker) || ticker;

  return {
    ticker,
    name,
    rank: currentRank,
    previousRank,
    rankDelta: delta,
    changeType,
    movement: movementText(changeType, delta),
    score: numberOrNull(row.final_score),
    previousScore: numberOrNull(changed?.previous_score),
    status: clean(row.final_status || changed?.current_status),
    previousStatus: clean(changed?.previous_status),
    frontDeskInstruction: clean(row.front_desk_instruction || changed?.front_desk_instruction),
    mainReason: clean(row.main_reason),
    mainRisk: clean(row.main_risk || changed?.main_risk),
    analysisDate: clean(row.analysis_date || date),
    scores: scoreMap(row)
  };
}

function normalizeDroppedRow(row, previousByTicker, names) {
  const ticker = clean(row.ticker);
  const previous = previousByTicker.get(ticker);
  return {
    ticker,
    name: clean(row.name) || names.get(ticker) || ticker,
    previousRank: intOrNull(row.previous_rank) || previous?.rank || null,
    previousScore: numberOrNull(row.previous_score) ?? previous?.score ?? null,
    previousStatus: clean(row.previous_status) || previous?.status || "",
    changeType: "DROPPED",
    movement: "退出",
    mainRisk: clean(row.main_risk) || previous?.mainRisk || ""
  };
}

function summarize(rows, dropped) {
  const count = (type) => rows.filter((row) => row.changeType === type).length;
  const scoreRows = rows.filter((row) => row.score !== null);
  const highRisk = rows.filter((row) => row.status === "High Risk Watch").length;
  const avgScore = scoreRows.length
    ? Math.round((scoreRows.reduce((sum, row) => sum + row.score, 0) / scoreRows.length) * 100) / 100
    : null;

  return {
    total: rows.length,
    new: count("NEW"),
    up: count("UP"),
    down: count("DOWN"),
    unchanged: count("UNCHANGED"),
    retained: rows.length - count("NEW"),
    dropped: dropped.length,
    highRisk,
    avgScore
  };
}

function buildTickerHistory(days) {
  const history = {};
  days.forEach((day) => {
    day.rows.forEach((row) => {
      if (!history[row.ticker]) {
        history[row.ticker] = {
          ticker: row.ticker,
          name: row.name,
          appearances: []
        };
      }
      history[row.ticker].appearances.push({
        date: day.date,
        rank: row.rank,
        score: row.score,
        status: row.status,
        changeType: row.changeType
      });
    });
  });
  return history;
}

function buildSnapshot(sourceRoot) {
  const changesDir = path.join(sourceRoot, "outputs", "daily_leaderboard_changes");
  const watchlistFiles = collectWatchlistFiles(sourceRoot);
  const changeFiles = new Map(listCsvFiles(changesDir, "leaderboard_changes").map((filePath) => [
    dateFromFile(filePath, "leaderboard_changes"),
    filePath
  ]));
  const names = loadNames(sourceRoot);
  const previousByTicker = new Map();

  const days = watchlistFiles.map((fileInfo, index) => {
    const { date, filePath, root, label } = fileInfo;
    const changeRows = changeFiles.has(date) ? readCsv(changeFiles.get(date)) : [];
    const changesByTicker = new Map(changeRows.map((row) => [row.ticker, row]));
    const rows = readCsv(filePath)
      .map((row) => normalizeWatchRow(row, date, previousByTicker, changesByTicker, names))
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));
    const currentTickers = new Set(rows.map((row) => row.ticker));
    const dropped = changeRows
      .filter((row) => row.change_type === "DROPPED")
      .map((row) => normalizeDroppedRow(row, previousByTicker, names));

    if (!dropped.length && index > 0) {
      previousByTicker.forEach((previous, ticker) => {
        if (!currentTickers.has(ticker)) {
          dropped.push({
            ticker,
            name: previous.name,
            previousRank: previous.rank,
            previousScore: previous.score,
            previousStatus: previous.status,
            changeType: "DROPPED",
            movement: "退出",
            mainRisk: previous.mainRisk || ""
          });
        }
      });
    }

    previousByTicker.clear();
    rows.forEach((row) => previousByTicker.set(row.ticker, row));

    return {
      date,
      previousDate: index > 0 ? watchlistFiles[index - 1].date : "",
      sourceFile: label === "source" ? path.relative(root, filePath) : path.relative(TURNPO_ROOT, filePath),
      changeFile: changeFiles.has(date) ? path.relative(sourceRoot, changeFiles.get(date)) : "",
      summary: summarize(rows, dropped),
      rows,
      dropped: dropped.sort((a, b) => (a.previousRank || 999) - (b.previousRank || 999))
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    sourceKind: "stock-pdc-local daily watchlists + turnpo backfills",
    backfillRoot: path.relative(TURNPO_ROOT, BACKFILL_WATCHLIST_DIR),
    dates: days.map((day) => day.date),
    latestDate: days.at(-1)?.date || "",
    days,
    tickerHistory: buildTickerHistory(days)
  };
}

const sourceRoot = path.resolve(argValue("--source-root", process.env.STOCK_PDC_ROOT || DEFAULT_SOURCE_ROOT));
const outputPath = path.resolve(argValue("--output", OUTPUT_PATH));
const snapshot = buildSnapshot(sourceRoot);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(`Dates: ${snapshot.dates.join(", ") || "none"}`);
console.log(`Latest: ${snapshot.latestDate || "none"}`);
