"""Reading the day's inputs. No fetching, no scoring, no judgement.

The daily path consumes what the existing pipeline already produced:

* ``outputs/full_pdc_scores.csv`` — the Hawkeye survivors with the nine
  deterministic scores, status and per-dimension observations
* ``outputs_a_share/a_share_universe.csv`` — names, turnover, market cap and the
  session date each quote belongs to
* ``data_a_share_latest_runs/run_*`` — the daily bars every measurement is
  computed from

Nothing here re-derives Hawkeye, re-runs the scorers or touches the network. A
missing input is reported; it is never substituted.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ...data_loader import load_bars_from_csv
from ...models import Bar
from . import facts as facts_module


class SourceError(RuntimeError):
    """An input the daily run cannot proceed without is missing or unusable."""


NUMERIC_SCORE_COLUMNS = ("risk_score", "overheat_score", "market_regime_score", "final_score", "rank")


def _number(value: object) -> float | None:
    if value is None:
        return None
    text = str(value).strip().replace(",", "")
    if text.lower() in {"", "-", "nan", "none"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        raise SourceError(f"找不到输入文件：{path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise SourceError(f"{path} 里没有数据行。")
    return rows


def newest_data_dir(root: Path) -> Path:
    """The most recent bar directory produced by the fetch step."""
    if not root.is_dir():
        raise SourceError(f"找不到行情目录：{root}")
    candidates = [path for path in root.iterdir() if path.is_dir() and any(path.glob("*.csv"))]
    if not candidates:
        raise SourceError(f"{root} 下没有任何含 CSV 的运行目录。")
    return max(candidates, key=lambda path: path.name)


@dataclass(frozen=True)
class DailyInputs:
    """Everything one daily run reads, already merged by ticker."""

    analysis_date: str
    candidates: list[dict[str, Any]]
    records: list[dict[str, Any]]
    names: dict[str, str]
    engine_facts: dict[str, dict[str, Any]]
    main_risks: dict[str, str]
    main_reasons: dict[str, str]
    market_regime_score: float | None
    data_dir: Path
    scores_path: Path
    universe_path: Path
    missing_bars: list[str]


def load(
    scores_csv: Path,
    universe_csv: Path,
    data_dir: Path,
) -> DailyInputs:
    """Merge the day's three inputs into one candidate list and one fact table."""
    scores = read_csv(scores_csv)
    universe = {
        str(row.get("ticker") or "").strip().upper(): row for row in read_csv(universe_csv)
    }

    analysis_date = str(scores[0].get("analysis_date") or "").strip()
    if not analysis_date:
        raise SourceError(f"{scores_csv} 缺少 analysis_date，无法判断数据新鲜度。")

    candidates: list[dict[str, Any]] = []
    records: list[dict[str, Any]] = []
    names: dict[str, str] = {}
    engine_facts: dict[str, dict[str, Any]] = {}
    main_risks: dict[str, str] = {}
    main_reasons: dict[str, str] = {}
    missing_bars: list[str] = []
    regime_scores: list[float] = []

    for row in scores:
        ticker = str(row.get("ticker") or "").strip().upper()
        if not ticker:
            continue
        meta = universe.get(ticker, {})
        name = str(meta.get("name") or "").strip()
        names[ticker] = name
        engine_facts[ticker] = {
            "riskScore": _number(row.get("risk_score")) or 0.0,
            "overheatScore": _number(row.get("overheat_score")) or 0.0,
            "finalStatus": str(row.get("final_status") or "").strip(),
        }
        main_risks[ticker] = str(row.get("main_risk") or "").strip()
        main_reasons[ticker] = str(row.get("main_reason") or "").strip()
        regime = _number(row.get("market_regime_score"))
        if regime is not None:
            regime_scores.append(regime)

        bars: list[Bar] = []
        bar_path = data_dir / f"{ticker}.csv"
        if bar_path.is_file():
            try:
                _symbol, bars = load_bars_from_csv(bar_path)
            except ValueError:
                bars = []
        if not bars:
            missing_bars.append(ticker)

        candidate = {
            "ticker": ticker,
            "name": name,
            "close": bars[-1].close if bars else None,
            "bar_count": len(bars),
            "bar_date": bars[-1].date if bars else "",
            "quote_date": str(meta.get("last_date") or "").strip(),
            "turnover_amount": _number(meta.get("turnover_amount")),
            "turnover_rate": _number(meta.get("turnover_rate")),
            "total_mcap": _number(meta.get("total_mcap")),
            "final_status": engine_facts[ticker]["finalStatus"],
        }
        candidates.append(candidate)

        if bars:
            try:
                records.append(
                    facts_module.build_record(
                        ticker,
                        bars,
                        {
                            "latest_date": bars[-1].date,
                            "turnover_amount": candidate["turnover_amount"],
                            "turnover_rate": candidate["turnover_rate"],
                            "total_mcap": candidate["total_mcap"],
                        },
                        {name_: row.get(name_, "") for name_ in facts_module.SIGNAL_FIELDS},
                    )
                )
            except facts_module.FactError:
                # A candidate whose bars cannot produce measurements is left out
                # of the fact table; the hard gate then blocks it for missing
                # data rather than a seat scoring an empty row.
                missing_bars.append(ticker)

    if not records:
        raise SourceError(
            f"没有任何候选能生成事实记录（行情目录 {data_dir}）。请确认已运行抓取步骤。"
        )

    # One market regime score is produced per run and repeated on every row; it
    # describes the market, not the stock.
    regime = round(sum(regime_scores) / len(regime_scores), 4) if regime_scores else None

    return DailyInputs(
        analysis_date=analysis_date,
        candidates=candidates,
        records=records,
        names=names,
        engine_facts=engine_facts,
        main_risks=main_risks,
        main_reasons=main_reasons,
        market_regime_score=regime,
        data_dir=data_dir,
        scores_path=scores_csv,
        universe_path=universe_csv,
        missing_bars=sorted(set(missing_bars)),
    )


def load_sector_map(path: Path | None) -> dict[str, str]:
    """Optional ticker→sector mapping for the concentration cap.

    When no map is supplied the cap reports itself inactive rather than
    inventing sectors from ticker prefixes, which encode the exchange and the
    board — not the industry.
    """
    if path is None:
        return {}
    if not path.is_file():
        raise SourceError(f"找不到行业映射文件：{path}")
    import json

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SourceError(f"行业映射文件无法解析：{path}（{exc}）") from exc
    if not isinstance(payload, dict):
        raise SourceError("行业映射文件必须是 {ticker: sector} 对象。")
    return {
        str(key).strip().upper(): str(value).strip()
        for key, value in payload.items()
        if str(key).strip() and str(value).strip()
    }
