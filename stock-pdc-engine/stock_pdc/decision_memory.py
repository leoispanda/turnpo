from __future__ import annotations

import csv
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING, Any

from .config import SCORER_LABELS

if TYPE_CHECKING:
    from .models import Bar, StockEvaluation


ROLE_KEYS = (
    "market_regime",
    "trend",
    "livermore",
    "volume_price",
    "candlestick",
    "overheat",
    "risk",
    "zhuge_orion",
    "chair",
)
FINAL_ROLE_KEY = "final_decision"
EXECUTED_ACTION = "NOT_EXECUTED_RESEARCH_ONLY"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _decision(status: str) -> str:
    if status in {"Strong Watch", "Trial Position"}:
        return "BUY"
    if status == "Remove":
        return "SELL"
    return "HOLD"


def _confidence(score: float) -> str:
    if score >= 7.5:
        return "HIGH"
    if score >= 5.5:
        return "MEDIUM"
    return "LOW"


def _prediction_direction(score: float) -> str:
    if score >= 6.0:
        return "BULLISH"
    if score <= 4.0:
        return "BEARISH"
    return "NEUTRAL"


def _connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.executescript(
        """
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS pdc_runs (
          execution_id TEXT PRIMARY KEY,
          analysis_date TEXT NOT NULL,
          executed_at TEXT NOT NULL,
          market_data_timestamp TEXT,
          status TEXT NOT NULL,
          error_message TEXT NOT NULL DEFAULT '',
          universe_count INTEGER NOT NULL DEFAULT 0,
          hawkeye_checked_count INTEGER NOT NULL DEFAULT 0,
          hawkeye_passed_count INTEGER NOT NULL DEFAULT 0,
          horizon_sessions INTEGER NOT NULL,
          executed_action TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS role_predictions (
          prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
          execution_id TEXT NOT NULL REFERENCES pdc_runs(execution_id),
          ticker TEXT NOT NULL,
          role_key TEXT NOT NULL,
          role_label TEXT NOT NULL,
          score REAL NOT NULL,
          summary TEXT NOT NULL,
          warning TEXT NOT NULL DEFAULT '',
          final_decision TEXT NOT NULL,
          confidence TEXT NOT NULL,
          executed_action TEXT NOT NULL,
          base_date TEXT NOT NULL,
          base_close REAL NOT NULL,
          horizon_sessions INTEGER NOT NULL,
          prediction_direction TEXT NOT NULL,
          outcome_status TEXT NOT NULL DEFAULT 'PENDING',
          outcome_date TEXT,
          outcome_return_pct REAL,
          is_correct INTEGER,
          failure_reason TEXT NOT NULL DEFAULT '',
          UNIQUE(execution_id, ticker, role_key)
        );
        CREATE TABLE IF NOT EXISTS model_runs (
          model_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
          execution_id TEXT NOT NULL REFERENCES pdc_runs(execution_id),
          model_id TEXT NOT NULL,
          status TEXT NOT NULL,
          summary TEXT NOT NULL DEFAULT '',
          UNIQUE(execution_id, model_id)
        );
        CREATE TABLE IF NOT EXISTS model_predictions (
          model_prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
          execution_id TEXT NOT NULL REFERENCES pdc_runs(execution_id),
          ticker TEXT NOT NULL,
          role_key TEXT NOT NULL,
          model_id TEXT NOT NULL,
          score REAL,
          summary TEXT NOT NULL DEFAULT '',
          prediction_direction TEXT NOT NULL DEFAULT 'UNKNOWN',
          outcome_status TEXT NOT NULL DEFAULT 'PENDING',
          outcome_return_pct REAL,
          is_correct INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_role_predictions_pending
          ON role_predictions(outcome_status, ticker, base_date);
        CREATE INDEX IF NOT EXISTS idx_role_predictions_role
          ON role_predictions(role_key, outcome_status);
        CREATE TABLE IF NOT EXISTS committee_model_runs (
          run_id TEXT NOT NULL,
          stage TEXT NOT NULL,
          analysis_date TEXT NOT NULL,
          model_id TEXT NOT NULL,
          model_version TEXT NOT NULL,
          status TEXT NOT NULL,
          failure_reason TEXT NOT NULL DEFAULT '',
          market_data_package_sha256 TEXT NOT NULL,
          PRIMARY KEY (run_id, stage, model_id)
        );
        CREATE TABLE IF NOT EXISTS committee_model_predictions (
          run_id TEXT NOT NULL,
          stage TEXT NOT NULL,
          analysis_date TEXT NOT NULL,
          model_id TEXT NOT NULL,
          ticker TEXT NOT NULL,
          score REAL NOT NULL,
          confidence REAL NOT NULL,
          decision TEXT NOT NULL,
          summary TEXT NOT NULL,
          base_date TEXT NOT NULL,
          base_close REAL NOT NULL,
          horizon_sessions INTEGER NOT NULL,
          outcome_status TEXT NOT NULL DEFAULT 'PENDING',
          outcome_date TEXT,
          outcome_return_pct REAL,
          is_correct INTEGER,
          failure_reason TEXT NOT NULL DEFAULT '',
          PRIMARY KEY (run_id, stage, model_id, ticker)
        );
        CREATE INDEX IF NOT EXISTS idx_committee_model_predictions_pending
          ON committee_model_predictions(outcome_status, ticker, base_date);
        """
    )
    return connection


def _max_market_date(universe: dict[str, list[Bar]]) -> str:
    return max((bars[-1].date for bars in universe.values() if bars), default="")


def _hawkeye_rows(path: Path | None) -> list[dict[str, str]]:
    if path is None or not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def _role_rows(evaluation: StockEvaluation) -> list[dict[str, object]]:
    rows = []
    for key in ROLE_KEYS:
        result = evaluation.scores[key]
        rows.append({
            "role_key": key,
            "role_label": SCORER_LABELS[key],
            "score": result.score,
            "summary": result.reason,
            "warning": result.warning,
        })
    rows.append({
        "role_key": FINAL_ROLE_KEY,
        "role_label": "Final Decision",
        "score": evaluation.final_score,
        "summary": evaluation.short_reason,
        "warning": evaluation.main_risk,
    })
    return rows


def _resolve_outcomes(connection: sqlite3.Connection, universe: dict[str, list[Bar]]) -> None:
    pending = connection.execute(
        "SELECT * FROM role_predictions WHERE outcome_status = 'PENDING'"
    ).fetchall()
    for prediction in pending:
        bars = universe.get(prediction["ticker"])
        if not bars:
            continue
        base_index = next((index for index, bar in enumerate(bars) if bar.date == prediction["base_date"]), None)
        if base_index is None:
            if bars[-1].date > prediction["base_date"]:
                connection.execute(
                    "UPDATE role_predictions SET outcome_status = 'FAILED', failure_reason = ? WHERE prediction_id = ?",
                    ("base market-data bar is unavailable in a later run", prediction["prediction_id"]),
                )
            continue
        outcome_index = base_index + prediction["horizon_sessions"]
        if outcome_index >= len(bars):
            continue
        outcome = bars[outcome_index]
        return_pct = round((outcome.close / prediction["base_close"] - 1.0) * 100.0, 6)
        direction = prediction["prediction_direction"]
        correct: int | None
        if direction == "BULLISH":
            correct = int(return_pct > 0)
        elif direction == "BEARISH":
            correct = int(return_pct <= 0)
        else:
            # Neutral is retained as a real prediction but has no directional
            # accuracy label; it must not inflate any role's win rate.
            correct = None
        connection.execute(
            """UPDATE role_predictions
               SET outcome_status = 'RESOLVED', outcome_date = ?, outcome_return_pct = ?, is_correct = ?
               WHERE prediction_id = ?""",
            (outcome.date, return_pct, correct, prediction["prediction_id"]),
        )


def _resolve_committee_model_outcomes(connection: sqlite3.Connection, universe: dict[str, list[Bar]]) -> None:
    pending = connection.execute(
        "SELECT * FROM committee_model_predictions WHERE outcome_status = 'PENDING'"
    ).fetchall()
    for prediction in pending:
        bars = universe.get(prediction["ticker"])
        if not bars:
            continue
        base_index = next((index for index, bar in enumerate(bars) if bar.date == prediction["base_date"]), None)
        if base_index is None:
            if bars[-1].date > prediction["base_date"]:
                connection.execute(
                    """UPDATE committee_model_predictions SET outcome_status = 'FAILED', failure_reason = ?
                       WHERE run_id = ? AND stage = ? AND model_id = ? AND ticker = ?""",
                    ("base market-data bar is unavailable in a later run", prediction["run_id"], prediction["stage"], prediction["model_id"], prediction["ticker"]),
                )
            continue
        outcome_index = base_index + prediction["horizon_sessions"]
        if outcome_index >= len(bars):
            continue
        outcome = bars[outcome_index]
        return_pct = round((outcome.close / prediction["base_close"] - 1.0) * 100.0, 6)
        if prediction["decision"] == "BUY":
            correct: int | None = int(return_pct > 0)
        elif prediction["decision"] == "SELL":
            correct = int(return_pct <= 0)
        else:
            correct = None
        connection.execute(
            """UPDATE committee_model_predictions
               SET outcome_status = 'RESOLVED', outcome_date = ?, outcome_return_pct = ?, is_correct = ?
               WHERE run_id = ? AND stage = ? AND model_id = ? AND ticker = ?""",
            (outcome.date, return_pct, correct, prediction["run_id"], prediction["stage"], prediction["model_id"], prediction["ticker"]),
        )


def record_committee_model_stage(
    database_path: Path,
    run_dir: Path,
    stage: str,
    horizon_sessions: int = 20,
) -> int:
    """Persist real Round 1/2 model callbacks without touching PDC weights."""
    if stage not in {"03", "05"}:
        raise ValueError("only Round 1 (03) and Round 2 (05) have model predictions")
    if horizon_sessions <= 0:
        raise ValueError("performance horizon must be positive")
    manifest = json.loads((run_dir / "manifest.json").read_text(encoding="utf-8"))
    package = json.loads((run_dir / "committee" / "02_market_data_package" / "market_data_package.json").read_text(encoding="utf-8"))
    output = json.loads((run_dir / "committee" / f"{stage}_{'round_1_top_30' if stage == '03' else 'round_2_top_20'}" / "output.json").read_text(encoding="utf-8"))
    prices: dict[str, float] = {}
    for row in package.get("candidateUniverse", []):
        ticker = str(row.get("ticker") or "").upper()
        raw_price = row.get("latest_close", row.get("latest_price", ""))
        try:
            if ticker:
                prices[ticker] = float(str(raw_price))
        except (TypeError, ValueError):
            continue
    run_id = str(manifest.get("run_id") or "")
    analysis_date = str(manifest.get("analysis_date") or "")
    base_date = str(package.get("marketDataDate") or analysis_date)
    model_results = output.get("modelResults")
    if not isinstance(model_results, list):
        raise ValueError("committee stage has no recorded modelResults")
    stored = 0
    with _connect(database_path) as connection:
        for result in model_results:
            model_id = str(result.get("modelId") or "")
            model_version = str(result.get("modelVersion") or "")
            status = str(result.get("status") or "")
            if not model_id or not model_version or status not in {"COMPLETED", "FAILED"}:
                raise ValueError("committee stage contains an invalid real model result")
            connection.execute(
                """INSERT INTO committee_model_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(run_id, stage, model_id) DO NOTHING""",
                (run_id, stage, analysis_date, model_id, model_version, status, str(result.get("failureReason") or ""), str(package.get("packageSha256") or "")),
            )
            if status != "COMPLETED":
                continue
            for opinion in result.get("opinions", []):
                ticker = str(opinion.get("ticker") or "").upper()
                if ticker not in prices:
                    continue
                connection.execute(
                    """INSERT INTO committee_model_predictions
                       (run_id, stage, analysis_date, model_id, ticker, score, confidence, decision, summary, base_date, base_close, horizon_sessions)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                       ON CONFLICT(run_id, stage, model_id, ticker) DO NOTHING""",
                    (run_id, stage, analysis_date, model_id, ticker, float(opinion["score"]), float(opinion["confidence"]), str(opinion["decision"]), str(opinion["summary"]), base_date, prices[ticker], horizon_sessions),
                )
                stored += 1
        _resolve_committee_model_outcomes(connection, {})
    return stored


def _performance_rows(connection: sqlite3.Connection) -> list[dict[str, object]]:
    result: list[dict[str, object]] = []
    for role_key in (*ROLE_KEYS, FINAL_ROLE_KEY):
        row = connection.execute(
            """SELECT COUNT(*) AS predictions,
                      SUM(CASE WHEN outcome_status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved,
                      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
                      SUM(CASE WHEN is_correct IS NOT NULL THEN 1 ELSE 0 END) AS directional,
                      AVG(CASE WHEN outcome_status = 'RESOLVED' THEN outcome_return_pct END) AS average_return,
                      MIN(CASE WHEN outcome_status = 'RESOLVED' THEN outcome_return_pct END) AS maximum_loss
               FROM role_predictions WHERE role_key = ?""",
            (role_key,),
        ).fetchone()
        directional = int(row["directional"] or 0)
        result.append({
            "role_key": role_key,
            "role_label": "Final Decision" if role_key == FINAL_ROLE_KEY else SCORER_LABELS[role_key],
            "predictions": int(row["predictions"] or 0),
            "resolved": int(row["resolved"] or 0),
            "correct": int(row["correct"] or 0),
            "directional": directional,
            "win_rate": (round(100 * int(row["correct"] or 0) / directional, 2) if directional else None),
            "average_return": row["average_return"],
            "maximum_loss": row["maximum_loss"],
        })
    return result


def write_performance_report(database_path: Path, report_path: Path) -> Path:
    with _connect(database_path) as connection:
        role_rows = _performance_rows(connection)
        models = connection.execute(
            """SELECT model_id, stage, COUNT(*) AS predictions,
                      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
                      SUM(CASE WHEN is_correct IS NOT NULL THEN 1 ELSE 0 END) AS directional,
                      AVG(CASE WHEN outcome_status = 'RESOLVED' THEN outcome_return_pct END) AS average_return,
                      MIN(CASE WHEN outcome_status = 'RESOLVED' THEN outcome_return_pct END) AS maximum_loss
               FROM committee_model_predictions GROUP BY model_id, stage ORDER BY model_id, stage"""
        ).fetchall()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# PDC Historical Performance Report",
        "",
        "Only resolved, directional predictions contribute to win rate. Neutral predictions remain audited but do not count as wins or losses. No role weights are adjusted by this report.",
        "",
        "## PDC Role Performance",
        "",
        "| Role | Predictions | Resolved | Directional | Correct | Win rate | Average return | Maximum loss |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for row in role_rows:
        percent = "--" if row["win_rate"] is None else f"{row['win_rate']:.2f}%"
        average = "--" if row["average_return"] is None else f"{float(row['average_return']):.2f}%"
        loss = "--" if row["maximum_loss"] is None else f"{float(row['maximum_loss']):.2f}%"
        lines.append(f"| {row['role_label']} | {row['predictions']} | {row['resolved']} | {row['directional']} | {row['correct']} | {percent} | {average} | {loss} |")
    lines.extend(["", "## AI Model Performance", ""])
    if not models:
        lines.append("No actual AI model predictions have been recorded. The current PDC engine is deterministic; no model score or summary is invented.")
    else:
        lines.extend(["| Model | Committee stage | Predictions | Correct | Win rate | Average return | Maximum loss |", "| --- | --- | ---: | ---: | ---: | ---: | ---: |"])
        for row in models:
            directional = int(row["directional"] or 0)
            rate = "--" if not directional else f"{100 * int(row['correct'] or 0) / directional:.2f}%"
            average = "--" if row["average_return"] is None else f"{float(row['average_return']):.2f}%"
            loss = "--" if row["maximum_loss"] is None else f"{float(row['maximum_loss']):.2f}%"
            lines.append(f"| {row['model_id']} | {row['stage']} | {row['predictions']} | {row['correct'] or 0} | {rate} | {average} | {loss} |")
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return report_path


def _append_markdown_log(
    logs_dir: Path,
    execution_id: str,
    analysis_date: str,
    executed_at: str,
    market_data_timestamp: str,
    universe: dict[str, list[Bar]],
    hawkeye_rows: list[dict[str, str]],
    evaluations: list[StockEvaluation],
) -> Path:
    logs_dir.mkdir(parents=True, exist_ok=True)
    path = logs_dir / f"{analysis_date}_PDC_DECISION.md"
    lines = [
        f"# PDC Decision Audit — {analysis_date}",
        "",
        f"## Execution {execution_id}",
        "",
        "- Status: COMPLETED",
        f"- Execution time (UTC): {executed_at}",
        f"- Market data timestamp: {market_data_timestamp or 'FAILED / unavailable'}",
        f"- Universe count: {len(universe)}",
        f"- Executed action: {EXECUTED_ACTION}",
        "",
        "## Stock Universe",
        "",
        ", ".join(sorted(universe)) if universe else "FAILED / unavailable",
        "",
        "## Hawkeye Filter Results",
        "",
    ]
    if hawkeye_rows:
        lines.extend(["| Ticker | Passed | Market cap | 60d return | Reason | Rejection |", "| --- | --- | ---: | ---: | --- | --- |"])
        for row in hawkeye_rows:
            lines.append("| {ticker} | {passed} | {mcap} | {return_60d} | {reason} | {rejection} |".format(
                ticker=row.get("ticker", ""), passed=row.get("passed", ""), mcap=row.get("total_mcap", ""),
                return_60d=row.get("return_60d", ""), reason=row.get("reason", "").replace("|", "/"),
                rejection=row.get("rejection_reason", "").replace("|", "/"),
            ))
    else:
        lines.append("NOT_APPLIED: this execution did not use Hawkeye Radar.")
    lines.extend(["", "## AI Model Results", "", "No AI model was invoked by the deterministic PDC engine. No model score or summary is fabricated.", "", "## PDC Decisions", ""])
    for evaluation in evaluations:
        decision = _decision(evaluation.status)
        lines.extend([
            f"### {evaluation.ticker}",
            "",
            f"- Final decision: {decision}",
            f"- PDC status: {evaluation.status}",
            f"- Confidence: {_confidence(evaluation.final_score)} (derived from final PDC score, not an AI response)",
            f"- Executed action: {EXECUTED_ACTION}",
            f"- Final score: {evaluation.final_score}",
            f"- Main risk: {evaluation.main_risk}",
            "",
            "| Role | Score | Summary | Warning |",
            "| --- | ---: | --- | --- |",
        ])
        for role in _role_rows(evaluation):
            lines.append(f"| {role['role_label']} | {role['score']} | {str(role['summary']).replace('|', '/')} | {str(role['warning']).replace('|', '/')} |")
        lines.append("")
    with path.open("a", encoding="utf-8") as file:
        if path.stat().st_size:
            file.write("\n---\n\n")
        file.write("\n".join(lines) + "\n")
    return path


def record_completed_run(
    database_path: Path,
    report_path: Path,
    logs_dir: Path,
    analysis_date: str,
    universe: dict[str, list[Bar]],
    evaluations: list[StockEvaluation],
    hawkeye_audit_path: Path | None,
    horizon_sessions: int,
) -> dict[str, Path]:
    if horizon_sessions <= 0:
        raise ValueError("performance horizon must be positive")
    execution_id = str(uuid.uuid4())
    executed_at = _utc_now()
    market_data_timestamp = _max_market_date(universe)
    hawkeye_rows = _hawkeye_rows(hawkeye_audit_path)
    with _connect(database_path) as connection:
        connection.execute(
            """INSERT INTO pdc_runs VALUES (?, ?, ?, ?, 'COMPLETED', '', ?, ?, ?, ?, ?)""",
            (execution_id, analysis_date, executed_at, market_data_timestamp, len(universe), len(hawkeye_rows), sum(row.get("passed", "").lower() == "true" for row in hawkeye_rows), horizon_sessions, EXECUTED_ACTION),
        )
        for evaluation in evaluations:
            decision = _decision(evaluation.status)
            confidence = _confidence(evaluation.final_score)
            for role in _role_rows(evaluation):
                score = float(role["score"])
                connection.execute(
                    """INSERT INTO role_predictions
                       (execution_id, ticker, role_key, role_label, score, summary, warning, final_decision, confidence, executed_action, base_date, base_close, horizon_sessions, prediction_direction)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (execution_id, evaluation.ticker, role["role_key"], role["role_label"], score, role["summary"], role["warning"], decision, confidence, EXECUTED_ACTION, evaluation.latest_date, evaluation.latest_close, horizon_sessions, _prediction_direction(score)),
                )
        _resolve_outcomes(connection, universe)
        _resolve_committee_model_outcomes(connection, universe)
    log_path = _append_markdown_log(logs_dir, execution_id, analysis_date, executed_at, market_data_timestamp, universe, hawkeye_rows, evaluations)
    return {"log": log_path, "database": database_path, "report": write_performance_report(database_path, report_path)}


def record_failed_run(logs_dir: Path, database_path: Path, analysis_date: str, error_message: str, horizon_sessions: int) -> Path:
    execution_id = str(uuid.uuid4())
    executed_at = _utc_now()
    with _connect(database_path) as connection:
        connection.execute(
            "INSERT INTO pdc_runs VALUES (?, ?, ?, '', 'FAILED', ?, 0, 0, 0, ?, ?)",
            (execution_id, analysis_date, executed_at, error_message, horizon_sessions, EXECUTED_ACTION),
        )
    logs_dir.mkdir(parents=True, exist_ok=True)
    path = logs_dir / f"{analysis_date}_PDC_DECISION.md"
    with path.open("a", encoding="utf-8") as file:
        if path.stat().st_size:
            file.write("\n---\n\n")
        file.write(f"# PDC Decision Audit — {analysis_date}\n\n## Execution {execution_id}\n\n- Execution time (UTC): {executed_at}\n- Status: FAILED\n- Failure: {error_message}\n- Executed action: {EXECUTED_ACTION}\n")
    return path
