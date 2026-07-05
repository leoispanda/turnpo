import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TURNPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_ROOT = "/Users/leoyang/Documents/financial freedom/stock-pdc-local";
const OUTPUT_PATH = path.join(TURNPO_ROOT, "stock-pdc", "rank-flow.json");
const BACKFILL_WATCHLIST_DIR = path.join(TURNPO_ROOT, "stock-pdc", "backfill", "daily_watchlists");
const DEFAULT_BENCHMARK_TICKER = "CSI300ETF";
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

function dateParts(value) {
  const [year, month, day] = String(value || "").split("-").map((part) => Number.parseInt(part, 10));
  return [year, month, day].every(Number.isFinite) ? { year, month, day } : null;
}

function dayOfWeek(value) {
  const parts = dateParts(value);
  return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() : null;
}

function isTradingWeekday(value) {
  const weekday = dayOfWeek(value);
  return weekday !== null && weekday !== 0 && weekday !== 6;
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

function round2(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function lastBarDate(dataDir, ticker = DEFAULT_BENCHMARK_TICKER) {
  const filePath = path.join(dataDir, `${ticker}.csv`);
  if (!fs.existsSync(filePath)) return "";
  const rows = readCsv(filePath);
  return rows.at(-1)?.Date || rows.at(-1)?.date || "";
}

function resolvePriceDataDir(sourceRoot, latestDate, explicitDataDir = "") {
  const explicitPath = clean(explicitDataDir);
  if (explicitPath) {
    const resolved = path.isAbsolute(explicitPath) ? explicitPath : path.join(sourceRoot, explicitPath);
    return fs.existsSync(resolved) ? resolved : "";
  }

  const latestDataDirs = fs.existsSync(sourceRoot)
    ? fs.readdirSync(sourceRoot)
      .filter((entry) => entry.startsWith("data_a_share_latest_"))
      .sort()
      .reverse()
    : [];
  const candidates = [
    ...latestDataDirs,
    "data_a_share",
    "data_a_share_live_mcap",
    "data_a_share_live_mcap_2020",
    "data_a_share_live_mcap_2020_em"
  ];

  for (const name of candidates) {
    const dataDir = path.join(sourceRoot, name);
    if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) continue;
    const latestBarDate = lastBarDate(dataDir);
    if (!latestDate || latestBarDate >= latestDate) return dataDir;
  }

  return "";
}

function loadPriceBars(priceDataDir, ticker, priceCache) {
  const cacheKey = `${priceDataDir}:${ticker}`;
  if (priceCache.has(cacheKey)) return priceCache.get(cacheKey);
  const filePath = path.join(priceDataDir, `${ticker}.csv`);
  if (!priceDataDir || !fs.existsSync(filePath)) {
    priceCache.set(cacheKey, []);
    return [];
  }
  const rows = readCsv(filePath)
    .map((row) => ({
      date: clean(row.Date || row.date),
      close: numberOrNull(row.Close || row.close)
    }))
    .filter((row) => row.date && row.close !== null && row.close > 0);
  priceCache.set(cacheKey, rows);
  return rows;
}

function priceMoveForTicker(ticker, date, priceDataDir, priceCache) {
  const bars = loadPriceBars(priceDataDir, ticker, priceCache);
  const index = bars.findIndex((bar) => bar.date === date);
  if (index < 0) return { close: null, previousClose: null, dayChangePct: null };
  const current = bars[index];
  const previous = bars[index - 1] || null;
  const dayChangePct = previous?.close
    ? round2((current.close / previous.close - 1) * 100)
    : null;
  return {
    close: round2(current.close),
    previousClose: previous?.close ? round2(previous.close) : null,
    dayChangePct
  };
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

function normalizeWatchRow(row, date, previousByTicker, changesByTicker, names, priceDataDir, priceCache) {
  const ticker = clean(row.ticker);
  const currentRank = intOrNull(row.rank);
  const changed = changesByTicker.get(ticker);
  const previousRank = intOrNull(changed?.previous_rank) || previousByTicker.get(ticker)?.rank || null;
  const changeType = clean(changed?.change_type) || changeFromRanks(currentRank, previousRank);
  const delta = intOrNull(changed?.rank_delta) ?? rankDelta(currentRank, previousRank);
  const name = clean(changed?.name) || names.get(ticker) || ticker;
  const priceMove = priceMoveForTicker(ticker, date, priceDataDir, priceCache);

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
    close: priceMove.close,
    previousClose: priceMove.previousClose,
    dayChangePct: priceMove.dayChangePct,
    scores: scoreMap(row)
  };
}

function normalizeDroppedRow(row, date, previousByTicker, names, priceDataDir, priceCache) {
  const ticker = clean(row.ticker);
  const previous = previousByTicker.get(ticker);
  const priceMove = priceMoveForTicker(ticker, date, priceDataDir, priceCache);
  return {
    ticker,
    name: clean(row.name) || names.get(ticker) || ticker,
    previousRank: intOrNull(row.previous_rank) || previous?.rank || null,
    previousScore: numberOrNull(row.previous_score) ?? previous?.score ?? null,
    previousStatus: clean(row.previous_status) || previous?.status || "",
    changeType: "DROPPED",
    movement: "退出",
    close: priceMove.close,
    previousClose: priceMove.previousClose,
    dayChangePct: priceMove.dayChangePct,
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
        changeType: row.changeType,
        dayChangePct: row.dayChangePct
      });
    });
  });
  return history;
}

function buildPortfolio(days) {
  let valuePct = 100;
  const daily = [];

  days
    .filter((day) => isTradingWeekday(day.date) && Array.isArray(day.rows) && day.rows.length)
    .forEach((day) => {
      const returns = day.rows
        .map((row) => row.dayChangePct)
        .filter((value) => Number.isFinite(value));
      const dailyReturnPct = returns.length
        ? round2(returns.reduce((sum, value) => sum + value, 0) / returns.length)
        : null;
      if (dailyReturnPct !== null) valuePct *= 1 + dailyReturnPct / 100;
      const portfolioDay = {
        date: day.date,
        investedCount: returns.length,
        dailyReturnPct,
        valuePct: round2(valuePct),
        cumulativeReturnPct: round2(valuePct - 100)
      };
      day.portfolio = portfolioDay;
      daily.push(portfolioDay);
    });

  return {
    method: "equal_weight_top20_daily_rebalanced",
    initialValuePct: 100,
    latestValuePct: daily.at(-1)?.valuePct ?? 100,
    latestReturnPct: daily.at(-1)?.cumulativeReturnPct ?? 0,
    daily
  };
}

function buildSnapshot(sourceRoot, explicitPriceDataDir = "") {
  const changesDir = path.join(sourceRoot, "outputs", "daily_leaderboard_changes");
  const watchlistFiles = collectWatchlistFiles(sourceRoot);
  const latestDate = watchlistFiles.at(-1)?.date || "";
  const priceDataDir = resolvePriceDataDir(sourceRoot, latestDate, explicitPriceDataDir);
  const priceCache = new Map();
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
      .map((row) => normalizeWatchRow(row, date, previousByTicker, changesByTicker, names, priceDataDir, priceCache))
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));
    const currentTickers = new Set(rows.map((row) => row.ticker));
    const dropped = changeRows
      .filter((row) => row.change_type === "DROPPED")
      .map((row) => normalizeDroppedRow(row, date, previousByTicker, names, priceDataDir, priceCache));

    if (!dropped.length && index > 0) {
      previousByTicker.forEach((previous, ticker) => {
        if (!currentTickers.has(ticker)) {
          const priceMove = priceMoveForTicker(ticker, date, priceDataDir, priceCache);
          dropped.push({
            ticker,
            name: previous.name,
            previousRank: previous.rank,
            previousScore: previous.score,
            previousStatus: previous.status,
            changeType: "DROPPED",
            movement: "退出",
            close: priceMove.close,
            previousClose: priceMove.previousClose,
            dayChangePct: priceMove.dayChangePct,
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
  const portfolio = buildPortfolio(days);

  return {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    sourceKind: "stock-pdc-local daily watchlists + turnpo backfills",
    backfillRoot: path.relative(TURNPO_ROOT, BACKFILL_WATCHLIST_DIR),
    priceDataDir: priceDataDir ? path.relative(sourceRoot, priceDataDir) : "",
    dates: days.map((day) => day.date),
    latestDate: days.at(-1)?.date || "",
    days,
    portfolio,
    tickerHistory: buildTickerHistory(days)
  };
}

const sourceRoot = path.resolve(argValue("--source-root", process.env.STOCK_PDC_ROOT || DEFAULT_SOURCE_ROOT));
const outputPath = path.resolve(argValue("--output", OUTPUT_PATH));
const priceDataDir = argValue("--price-data-dir", process.env.STOCK_PDC_PRICE_DATA_DIR || "");
const snapshot = buildSnapshot(sourceRoot, priceDataDir);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(`Dates: ${snapshot.dates.join(", ") || "none"}`);
console.log(`Latest: ${snapshot.latestDate || "none"}`);
console.log(`Price data: ${snapshot.priceDataDir || "none"}`);
