import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TURNPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_ROOT = path.join(TURNPO_ROOT, "stock-pdc-engine");
const OUTPUT_PATH = path.join(TURNPO_ROOT, "stock-pdc", "rank-flow.json");
const AB_OUTPUT_PATH = path.join(TURNPO_ROOT, "stock-pdc", "ab-flow.json");
const DECISION_CANDIDATE_OUTPUT_PATH = path.join(TURNPO_ROOT, "stock-pdc", "decision-candidates.json");
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

function expandPriceDataDirCandidates(sourceRoot) {
  if (!fs.existsSync(sourceRoot)) return [];
  const rootEntries = fs.readdirSync(sourceRoot).sort().reverse();
  const expanded = [];

  rootEntries
    .filter((entry) => entry.startsWith("data_a_share_latest_"))
    .forEach((entry) => {
      const dir = path.join(sourceRoot, entry);
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
      expanded.push(dir);
      if (entry === "data_a_share_latest_runs") {
        fs.readdirSync(dir)
          .sort()
          .reverse()
          .forEach((subEntry) => {
            const subDir = path.join(dir, subEntry);
            if (fs.existsSync(subDir) && fs.statSync(subDir).isDirectory()) {
              expanded.push(subDir);
            }
          });
      }
    });

  return expanded;
}

function resolvePriceDataDir(sourceRoot, latestDate, explicitDataDir = "") {
  const explicitPath = clean(explicitDataDir);
  if (explicitPath) {
    const resolved = path.isAbsolute(explicitPath) ? explicitPath : path.join(sourceRoot, explicitPath);
    return fs.existsSync(resolved) ? resolved : "";
  }

  const candidates = [
    ...expandPriceDataDirCandidates(sourceRoot),
    "data_a_share",
    "data_a_share_live_mcap",
    "data_a_share_live_mcap_2020",
    "data_a_share_live_mcap_2020_em"
  ].map((candidate) => path.isAbsolute(candidate) ? candidate : path.join(sourceRoot, candidate));

  for (const dataDir of candidates) {
    if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) continue;
    const latestBarDate = lastBarDate(dataDir);
    if (!latestDate || latestBarDate >= latestDate) return dataDir;
  }

  return "";
}

function priceDataDirCandidates(sourceRoot, primaryDir) {
  const candidates = [
    primaryDir,
    ...expandPriceDataDirCandidates(sourceRoot),
    path.join(sourceRoot, "data_a_share"),
    path.join(sourceRoot, "data_a_share_live_mcap"),
    path.join(sourceRoot, "data_a_share_live_mcap_2020"),
    path.join(sourceRoot, "data_a_share_live_mcap_2020_em")
  ].filter(Boolean);
  return [...new Set(candidates)].filter((dir) => fs.existsSync(dir) && fs.statSync(dir).isDirectory());
}

function loadPriceBars(priceDataDirs, ticker, priceCache) {
  const cacheKey = `${priceDataDirs.join("|")}:${ticker}`;
  if (priceCache.has(cacheKey)) return priceCache.get(cacheKey);
  const filePath = priceDataDirs
    .map((dir) => path.join(dir, `${ticker}.csv`))
    .find((candidate) => fs.existsSync(candidate));
  if (!filePath) {
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

function priceMoveForTicker(ticker, date, priceDataDirs, priceCache) {
  const bars = loadPriceBars(priceDataDirs, ticker, priceCache);
  const index = bars.findIndex((bar) => bar.date === date);
  if (index < 0) {
    return {
      close: null,
      nextClose: null,
      returnDate: "",
      signalDayChangePct: null,
      dayChangePct: null
    };
  }
  const previous = bars[index - 1] || null;
  const current = bars[index];
  const next = bars[index + 1] || null;
  const signalDayChangePct = previous?.close && current.close
    ? round2((current.close / previous.close - 1) * 100)
    : null;
  const dayChangePct = next?.close && current.close
    ? round2((next.close / current.close - 1) * 100)
    : null;
  return {
    close: round2(current.close),
    nextClose: next?.close ? round2(next.close) : null,
    returnDate: next?.date || "",
    signalDayChangePct,
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

function droppedExitAction(signalDayChangePct) {
  return Number.isFinite(signalDayChangePct) && signalDayChangePct > 0
    ? "HOLD_DROPPED_UP_DAY"
    : "SELL_REVIEW_DROPPED";
}

function droppedExitText(signalDayChangePct) {
  return droppedExitAction(signalDayChangePct) === "HOLD_DROPPED_UP_DAY"
    ? "上涨不卖"
    : "卖出复核";
}

function normalizeWatchRow(row, date, previousByTicker, changesByTicker, names, priceDataDirs, priceCache) {
  const ticker = clean(row.ticker);
  const currentRank = intOrNull(row.rank);
  const changed = changesByTicker.get(ticker);
  const previousRank = intOrNull(changed?.previous_rank) || previousByTicker.get(ticker)?.rank || null;
  const changeType = clean(changed?.change_type) || changeFromRanks(currentRank, previousRank);
  const delta = intOrNull(changed?.rank_delta) ?? rankDelta(currentRank, previousRank);
  const name = clean(changed?.name) || names.get(ticker) || ticker;
  const priceMove = priceMoveForTicker(ticker, date, priceDataDirs, priceCache);
  const finalStatus = clean(row.final_status || changed?.current_status);
  const frontDeskInstruction = clean(row.front_desk_instruction || changed?.front_desk_instruction);
  const mainReason = clean(row.main_reason);
  const mainRisk = clean(row.main_risk || changed?.main_risk);

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
    status: finalStatus,
    previousStatus: clean(changed?.previous_status),
    frontDeskInstruction,
    mainReason,
    mainRisk,
    analysisDate: clean(row.analysis_date || date),
    close: priceMove.close,
    nextClose: priceMove.nextClose,
    returnDate: priceMove.returnDate,
    signalDayChangePct: priceMove.signalDayChangePct,
    dayChangePct: priceMove.dayChangePct,
    scores: scoreMap(row),
    decision: {
      policy: "TOP20_RESEARCH_RANK",
      targetHolding: false,
      action: frontDeskInstruction || "RESEARCH_WATCH",
      basis: "PDC research rank; action comes from the PDC instruction/status"
    },
    research: {
      finalStatus,
      previousStatus: clean(changed?.previous_status),
      frontDeskInstruction,
      mainReason,
      mainRisk,
      scores: scoreMap(row)
    }
  };
}

function normalizeDroppedRow(row, date, previousByTicker, names, priceDataDirs, priceCache) {
  const ticker = clean(row.ticker);
  const previous = previousByTicker.get(ticker);
  const priceMove = priceMoveForTicker(ticker, date, priceDataDirs, priceCache);
  return {
    ticker,
    name: clean(row.name) || names.get(ticker) || ticker,
    previousRank: intOrNull(row.previous_rank) || previous?.rank || null,
    previousScore: numberOrNull(row.previous_score) ?? previous?.score ?? null,
    previousStatus: clean(row.previous_status) || previous?.status || "",
    changeType: "DROPPED",
    movement: "退出",
    close: priceMove.close,
    nextClose: priceMove.nextClose,
    returnDate: priceMove.returnDate,
    signalDayChangePct: priceMove.signalDayChangePct,
    dayChangePct: priceMove.dayChangePct,
    exitAction: droppedExitAction(priceMove.signalDayChangePct),
    exitText: droppedExitText(priceMove.signalDayChangePct),
    mainRisk: clean(row.main_risk) || previous?.mainRisk || "",
    decision: {
      policy: "TOP20_ROTATION_EXIT_REVIEW",
      targetHolding: false,
      action: droppedExitAction(priceMove.signalDayChangePct),
      basis: Number.isFinite(priceMove.signalDayChangePct) && priceMove.signalDayChangePct > 0
        ? "Dropped from Top 20 but signal day closed up"
        : "Dropped from Top 20"
    },
    research: {
      previousStatus: clean(row.previous_status) || previous?.status || "",
      previousScore: numberOrNull(row.previous_score) ?? previous?.score ?? null,
      mainRisk: clean(row.main_risk) || previous?.mainRisk || ""
    }
  };
}

function summarize(rows, dropped) {
  const count = (type) => rows.filter((row) => row.changeType === type).length;
  const scoreRows = rows.filter((row) => row.score !== null);
  const avgScore = scoreRows.length
    ? Math.round((scoreRows.reduce((sum, row) => sum + row.score, 0) / scoreRows.length) * 100) / 100
    : null;

  return {
    total: rows.length,
    targetHoldings: 0,
    inTop20: rows.length,
    new: count("NEW"),
    up: count("UP"),
    down: count("DOWN"),
    unchanged: count("UNCHANGED"),
    retained: rows.length - count("NEW"),
    dropped: dropped.length,
    avgScore,
    decisionRule: "Top 20 is a research ranking. Buy, hold, watch, and exit actions are determined separately by PDC status and instruction."
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
        returnDate: row.returnDate,
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
      if (dailyReturnPct === null) return;
      if (dailyReturnPct !== null) valuePct *= 1 + dailyReturnPct / 100;
      const portfolioDay = {
        date: day.date,
        returnDate: day.rows.find((row) => row.returnDate)?.returnDate || "",
        investedCount: returns.length,
        dailyReturnPct,
        valuePct: round2(valuePct),
        cumulativeReturnPct: round2(valuePct - 100)
      };
      day.portfolio = portfolioDay;
      daily.push(portfolioDay);
    });

  return {
    method: "equal_weight_top20_next_trading_day_close_to_close",
    initialValuePct: 100,
    latestValuePct: daily.at(-1)?.valuePct ?? 100,
    latestReturnPct: daily.at(-1)?.cumulativeReturnPct ?? 0,
    daily
  };
}

function buildBenchmark(days, priceDataDirs, priceCache, ticker = DEFAULT_BENCHMARK_TICKER) {
  let valuePct = 100;
  const daily = [];

  days
    .filter((day) => isTradingWeekday(day.date))
    .forEach((day) => {
      const priceMove = priceMoveForTicker(ticker, day.date, priceDataDirs, priceCache);
      if (!Number.isFinite(priceMove.dayChangePct)) return;
      valuePct *= 1 + priceMove.dayChangePct / 100;
      const benchmarkDay = {
        date: day.date,
        ticker,
        returnDate: priceMove.returnDate || "",
        close: priceMove.close,
        nextClose: priceMove.nextClose,
        dailyReturnPct: priceMove.dayChangePct,
        valuePct: round2(valuePct),
        cumulativeReturnPct: round2(valuePct - 100)
      };
      day.benchmark = benchmarkDay;
      daily.push(benchmarkDay);
    });

  return {
    method: "benchmark_next_trading_day_close_to_close",
    ticker,
    initialValuePct: 100,
    latestValuePct: daily.at(-1)?.valuePct ?? 100,
    latestReturnPct: daily.at(-1)?.cumulativeReturnPct ?? 0,
    daily
  };
}

function buildSnapshot(sourceRoot, explicitPriceDataDir = "") {
  const changesDir = path.join(sourceRoot, "outputs", "daily_leaderboard_changes");
  // A signal is valid only for an exchange weekday.  Keeping weekend CSVs in
  // the history used to make Monday's rank movement compare with a hidden
  // Saturday/Sunday snapshot instead of the last visible trading session.
  const watchlistFiles = collectWatchlistFiles(sourceRoot)
    .filter((fileInfo) => isTradingWeekday(fileInfo.date));
  const latestDate = watchlistFiles.at(-1)?.date || "";
  const priceDataDir = resolvePriceDataDir(sourceRoot, latestDate, explicitPriceDataDir);
  const priceDataDirs = priceDataDirCandidates(sourceRoot, priceDataDir);
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
      .map((row) => normalizeWatchRow(row, date, previousByTicker, changesByTicker, names, priceDataDirs, priceCache))
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));
    const currentTickers = new Set(rows.map((row) => row.ticker));
    const dropped = changeRows
      .filter((row) => row.change_type === "DROPPED")
      .map((row) => normalizeDroppedRow(row, date, previousByTicker, names, priceDataDirs, priceCache));

    if (!dropped.length && index > 0) {
      previousByTicker.forEach((previous, ticker) => {
        if (!currentTickers.has(ticker)) {
          const priceMove = priceMoveForTicker(ticker, date, priceDataDirs, priceCache);
          dropped.push({
            ticker,
            name: previous.name,
            previousRank: previous.rank,
            previousScore: previous.score,
            previousStatus: previous.status,
            changeType: "DROPPED",
            movement: "退出",
            close: priceMove.close,
            nextClose: priceMove.nextClose,
            returnDate: priceMove.returnDate,
            signalDayChangePct: priceMove.signalDayChangePct,
            dayChangePct: priceMove.dayChangePct,
            exitAction: droppedExitAction(priceMove.signalDayChangePct),
            exitText: droppedExitText(priceMove.signalDayChangePct),
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
  const benchmark = buildBenchmark(days, priceDataDirs, priceCache);

  return {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    sourceKind: "Turnpo Stock PDC engine daily watchlists + backfills",
    strategy: {
      version: "top20-rotation-v2",
      candidateStage: "Hawkeye Radar",
      rankingStage: "PDC scores rank radar-selected candidates",
      decisionRule: "Publish up to 20 radar-qualified names. Status fields are research-only.",
      exitRule: "Dropped names go to sell review unless signal day change is positive, then HOLD_DROPPED_UP_DAY.",
      researchRetention: "All factor scores, reasons, and risks are retained for later attribution and tuning."
    },
    backfillRoot: path.relative(TURNPO_ROOT, BACKFILL_WATCHLIST_DIR),
    priceDataDir: priceDataDir ? path.relative(sourceRoot, priceDataDir) : "",
    priceDataFallbacks: priceDataDirs.map((dir) => path.relative(sourceRoot, dir)),
    dates: days.map((day) => day.date),
    latestDate: days.at(-1)?.date || "",
    days,
    portfolio,
    benchmark,
    tickerHistory: buildTickerHistory(days)
    ,verification: {
      status: "LEGACY_UNVERIFIED",
      note: "Historical Top 20 display data; not a verified full-market automatic run."
    }
  };
}

function buildDecisionCandidateSnapshot(sourceRoot) {
  const historyPath = path.join(sourceRoot, "outputs", "scoring_history.csv");
  const generatedAt = new Date().toISOString();
  if (!fs.existsSync(historyPath)) {
    return {
      schemaVersion: "stock-pdc-decision-candidates-v1",
      generatedAt,
      availability: "UNAVAILABLE",
      latestDate: "",
      validationErrors: ["missing outputs/scoring_history.csv"],
      candidates: []
    };
  }

  const historyRows = readCsv(historyPath)
    .filter((row) => isTradingWeekday(row.run_date));
  const latestDate = historyRows.map((row) => clean(row.run_date)).filter(Boolean).sort().at(-1) || "";
  const names = loadNames(sourceRoot);
  const candidates = historyRows
    .filter((row) => clean(row.run_date) === latestDate && clean(row.ticker))
    .map((row, index) => ({
      ticker: clean(row.ticker).toUpperCase(),
      name: clean(names.get(clean(row.ticker)) || row.ticker),
      rank: intOrNull(row.rank) || index + 1,
      score: numberOrNull(row.final_score),
      status: clean(row.final_status),
      mainReason: clean(row.main_reason),
      mainRisk: clean(row.main_risk),
      scores: Object.fromEntries(SCORE_FIELDS
        .map((field) => [field, numberOrNull(row[field])])
        .filter(([, value]) => value !== null))
    }))
    .sort((left, right) => left.rank - right.rank);
  const validationErrors = [];
  if (!latestDate) validationErrors.push("no weekday candidate snapshot in outputs/scoring_history.csv");
  if (!candidates.length) validationErrors.push(`no candidates for ${latestDate || "the latest snapshot"}`);
  return {
    schemaVersion: "stock-pdc-decision-candidates-v1",
    generatedAt,
    availability: validationErrors.length ? "UNAVAILABLE" : "ACTIVE",
    latestDate,
    validationErrors,
    candidates
  };
}

function buildAbSnapshot(sourceRoot, aLatestDate) {
  const abRoot = path.join(sourceRoot, "outputs_ab");
  const experimentPath = path.join(abRoot, "experiment.json");
  const statusPath = path.join(abRoot, "status.json");
  const summaryPath = path.join(abRoot, "summary.json");
  const comparisonPath = path.join(abRoot, "comparison.csv");
  const requiredPaths = [experimentPath, statusPath, summaryPath, comparisonPath];
  const generatedAt = new Date().toISOString();
  const missing = requiredPaths.filter((filePath) => !fs.existsSync(filePath));
  if (missing.length) {
    return {
      schemaVersion: "stock-pdc-ab-v1",
      generatedAt,
      availability: "UNAVAILABLE",
      latestDate: "",
      validationErrors: missing.map((filePath) => `missing ${path.relative(sourceRoot, filePath)}`),
      experiment: null,
      runStatus: null,
      latestSignal: null,
      summary: null,
      comparison: []
    };
  }

  try {
    const experiment = JSON.parse(fs.readFileSync(experimentPath, "utf8"));
    const runStatus = JSON.parse(fs.readFileSync(statusPath, "utf8"));
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    const latestDate = clean(runStatus.latestSignalDate);
    const signalPath = path.join(abRoot, "signals", `signal_${latestDate}.csv`);
    const errors = [];
    if (!latestDate || !fs.existsSync(signalPath)) {
      errors.push(`missing latest frozen signal for ${latestDate || "unknown date"}`);
    }
    const signalRows = fs.existsSync(signalPath)
      ? readCsv(signalPath).map((row) => ({
          ...row,
          rank: intOrNull(row.rank),
          target_weight_pct: numberOrNull(row.target_weight_pct),
          initial_stop: numberOrNull(row.initial_stop),
          active_stop: numberOrNull(row.active_stop),
          stop_distance_pct: numberOrNull(row.stop_distance_pct)
        }))
      : [];
    const comparison = readCsv(comparisonPath).map((row) => ({
      comparison_track: clean(row.comparison_track),
      valuation_date: clean(row.valuation_date),
      a_nav: numberOrNull(row.a_nav),
      b_nav: numberOrNull(row.b_nav),
      b_minus_a_return_pct_points: numberOrNull(row.b_minus_a_return_pct_points),
      relative_nav_b_vs_a_pct: numberOrNull(row.relative_nav_b_vs_a_pct),
      a_drawdown_pct: numberOrNull(row.a_drawdown_pct),
      b_drawdown_pct: numberOrNull(row.b_drawdown_pct),
      drawdown_improvement_pct_points: numberOrNull(row.drawdown_improvement_pct_points)
    }));

    if (aLatestDate !== latestDate) errors.push(`A latestDate ${aLatestDate} != A/B latestDate ${latestDate}`);
    if (experiment.status !== "active_prospective") errors.push("experiment is not active_prospective");
    if (experiment.noBackfill !== true) errors.push("experiment noBackfill is not true");
    if (experiment.priceMode !== "public_tencent_unadjusted_fail_closed") errors.push("unexpected A/B price mode");
    if (summary.experimentStatus !== experiment.status) errors.push("summary experiment status mismatch");
    if (summary.effectiveSignalDate !== experiment.effectiveSignalDate) errors.push("effective signal date mismatch");
    if (runStatus.status !== experiment.status) errors.push("run status mismatch");
    if (Object.keys(runStatus.publicPriceFailures || {}).length) errors.push("public raw price failures are present");
    if (signalRows.some((row) => row.signal_date !== latestDate)) errors.push("latest signal contains mixed dates");
    const snapshotIds = [...new Set(signalRows.map((row) => clean(row.snapshot_id)).filter(Boolean))];
    if (snapshotIds.length !== 1 || snapshotIds[0] !== clean(runStatus.latestSnapshotId)) {
      errors.push("latest signal snapshot mismatch");
    }
    const expectedGroups = ["A_PORTFOLIO", "A_SELECTION", "B_PORTFOLIO", "B_SELECTION"];
    const groups = [...new Set(signalRows.map((row) => clean(row.strategy_id)))].sort();
    if (JSON.stringify(groups) !== JSON.stringify(expectedGroups)) errors.push("latest signal does not contain exactly four A/B groups");
    expectedGroups.forEach((group) => {
      const total = signalRows
        .filter((row) => row.strategy_id === group)
        .reduce((sum, row) => sum + (row.target_weight_pct || 0), 0);
      if (group.endsWith("_SELECTION") && Math.abs(total - 100) > 0.001) {
        errors.push(`${group} weights total ${total}, expected 100`);
      }
      if (group.endsWith("_PORTFOLIO") && total > 100.0001) {
        errors.push(`${group} weights exceed 100`);
      }
    });
    const comparisonLastDate = comparison.map((row) => row.valuation_date).filter(Boolean).sort().at(-1) || "";
    if (clean(summary.lastValuationDate) !== comparisonLastDate) errors.push("comparison tail date mismatch");

    return {
      schemaVersion: "stock-pdc-ab-v1",
      generatedAt,
      availability: errors.length ? "STALE" : "ACTIVE",
      latestDate,
      validationErrors: errors,
      experiment,
      runStatus,
      latestSignal: {
        date: latestDate,
        snapshotId: snapshotIds[0] || "",
        sourceFile: fs.existsSync(signalPath) ? path.relative(sourceRoot, signalPath) : "",
        rows: signalRows
      },
      summary,
      comparison
    };
  } catch (error) {
    return {
      schemaVersion: "stock-pdc-ab-v1",
      generatedAt,
      availability: "STALE",
      latestDate: "",
      validationErrors: [String(error?.message || error)],
      experiment: null,
      runStatus: null,
      latestSignal: null,
      summary: null,
      comparison: []
    };
  }
}

const sourceRoot = path.resolve(argValue("--source-root", process.env.STOCK_PDC_ROOT || DEFAULT_SOURCE_ROOT));
const outputPath = path.resolve(argValue("--output", OUTPUT_PATH));
const abOutputPath = path.resolve(argValue("--ab-output", AB_OUTPUT_PATH));
const priceDataDir = argValue("--price-data-dir", process.env.STOCK_PDC_PRICE_DATA_DIR || "");
function buildAutomaticSnapshot(sourceRoot) {
  const generatedAt = new Date().toISOString();
  const candidatePath = path.join(sourceRoot, "outputs", "candidate_universe.csv");
  const auditPath = path.join(sourceRoot, "outputs", "hawkeye_radar_audit.csv");
  const scoresPath = path.join(sourceRoot, "outputs", "full_pdc_scores.csv");
  const manifestPath = path.join(sourceRoot, "outputs", "automatic_run.json");
  const validationErrors = [candidatePath, auditPath, scoresPath, manifestPath]
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => `missing ${path.relative(sourceRoot, filePath)}`);

  if (validationErrors.length) {
    return {
      schemaVersion: "stock-pdc-automatic-v1",
      generatedAt,
      availability: "UNAVAILABLE",
      validationErrors,
      latestDate: "",
      marketCount: 0,
      candidateCount: 0,
      pdcCount: 0,
      rules: ["总市值 > 300 亿人民币", "近 60 个交易日收益 > 0"],
      candidates: []
    };
  }

  const runManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (runManifest.schema_version !== "stock-pdc-automatic-run-v1") validationErrors.push("invalid automatic run manifest schema");
  if (runManifest.source_scope !== "full_a_share_market") validationErrors.push("run was not sourced from the full A-share market");
  const candidateRows = readCsv(candidatePath)
    .filter((row) => String(row.passed).toLowerCase() === "true");
  const auditRows = readCsv(auditPath);
  const scoreRows = readCsv(scoresPath);
  const scoreByTicker = new Map(scoreRows.map((row) => [clean(row.ticker).toUpperCase(), row]));
  const candidates = candidateRows
    .map((candidate) => {
      const ticker = clean(candidate.ticker).toUpperCase();
      const score = scoreByTicker.get(ticker);
      return {
        ticker,
        name: clean(candidate.name) || ticker,
        marketCapCny: numberOrNull(candidate.total_mcap),
        return60dPct: numberOrNull(candidate.return_60d),
        rank: intOrNull(score?.rank),
        finalScore: numberOrNull(score?.final_score),
        finalStatus: clean(score?.final_status),
        mainReason: clean(score?.main_reason),
        mainRisk: clean(score?.main_risk),
        scores: score ? scoreMap(score) : {}
      };
    })
    .sort((left, right) => (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER));
  const analysisDates = [...new Set(scoreRows.map((row) => clean(row.analysis_date)).filter(Boolean))];
  if (analysisDates.length !== 1) validationErrors.push(`expected one analysis date in full_pdc_scores.csv, found ${analysisDates.length}`);
  if (candidates.some((row) => row.rank === null)) validationErrors.push("some Hawkeye candidates have no PDC result");
  if (scoreRows.length !== candidates.length) validationErrors.push(`PDC result count ${scoreRows.length} does not match Hawkeye candidate count ${candidates.length}`);
  if (analysisDates[0] !== clean(runManifest.analysis_date)) validationErrors.push("PDC analysis date does not match automatic run manifest");
  if (auditRows.length !== Number(runManifest.market_ticker_count)) validationErrors.push("Hawkeye audit count does not match full-market run manifest");

  return {
    schemaVersion: "stock-pdc-automatic-v1",
    generatedAt,
    availability: validationErrors.length ? "STALE" : "ACTIVE",
    validationErrors,
    latestDate: analysisDates[0] || "",
    marketCount: Number(runManifest.market_ticker_count),
    candidateCount: candidates.length,
    pdcCount: scoreRows.length,
    rules: ["总市值 > 300 亿人民币", "近 60 个交易日收益 > 0"],
    workflow: ["行情 API 自动抓取", "全市场 A 股数据", "鹰眼固定两条规则", "全部通过者进入 PDC", "PDC 研究排序、风险与观察结论"],
    candidates
  };
}

const snapshot = buildSnapshot(sourceRoot, priceDataDir);
const abSnapshot = buildAbSnapshot(sourceRoot, snapshot.latestDate);
const decisionCandidateSnapshot = buildDecisionCandidateSnapshot(sourceRoot);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
fs.mkdirSync(path.dirname(abOutputPath), { recursive: true });
fs.writeFileSync(abOutputPath, `${JSON.stringify(abSnapshot, null, 2)}\n`);
fs.mkdirSync(path.dirname(DECISION_CANDIDATE_OUTPUT_PATH), { recursive: true });
fs.writeFileSync(DECISION_CANDIDATE_OUTPUT_PATH, `${JSON.stringify(decisionCandidateSnapshot, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(`Latest: ${snapshot.latestDate || "none"}`);
console.log(`Market checked: ${snapshot.marketCount || 0}`);
console.log(`A/B: ${abSnapshot.availability} -> ${abOutputPath}`);
console.log(`Decision candidates: ${decisionCandidateSnapshot.candidates.length} on ${decisionCandidateSnapshot.latestDate || "none"} -> ${DECISION_CANDIDATE_OUTPUT_PATH}`);
