from __future__ import annotations

import argparse
import csv
import json
import os
import subprocess
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.config import HAWKEYE_MIN_MARKET_CAP_CNY, HAWKEYE_MIN_RETURN_60D_PCT
from stock_pdc.run_artifacts import stage_verified_run


def _project_path(value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def _read_universe_dates(universe_csv: Path) -> tuple[list[str], Counter[str]]:
    with universe_csv.open("r", encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))
    tickers = [row["ticker"] for row in rows if row.get("ticker")]
    dates = Counter(row.get("last_date", "") for row in rows if row.get("last_date"))
    return tickers, dates


def _last_bar_date(path: Path) -> str:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))
    if not rows:
        raise ValueError(f"{path} has no bars")
    return rows[-1].get("Date") or rows[-1].get("date") or ""


def _validate_latest_data(data_dir: Path, universe_csv: Path, benchmark: str) -> str:
    tickers, _universe_dates = _read_universe_dates(universe_csv)
    if not tickers:
        raise ValueError(f"No tickers found in {universe_csv}")
    benchmark_path = data_dir / f"{benchmark}.csv"
    if not benchmark_path.exists():
        raise ValueError(f"Missing benchmark OHLCV file: {benchmark}")
    latest_date = _last_bar_date(benchmark_path)
    if not latest_date:
        raise ValueError(f"Benchmark {benchmark} has no latest date")

    missing: list[str] = []
    future: list[str] = []
    for ticker in tickers:
        path = data_dir / f"{ticker}.csv"
        if not path.exists():
            missing.append(ticker)
            continue
        bar_date = _last_bar_date(path)
        if bar_date > latest_date:
            future.append(f"{ticker}:{bar_date}")

    if missing:
        raise ValueError(f"Missing OHLCV files: {', '.join(missing[:20])}")
    if future:
        raise ValueError(f"OHLCV dates after benchmark {latest_date}: {', '.join(future[:20])}")
    return latest_date


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Refresh public A-share data, validate dates, then run Stock PDC.")
    parser.add_argument("--top", type=int, default=20)
    parser.add_argument("--source", choices=["tencent", "eastmoney"], default="tencent")
    parser.add_argument("--bars", type=int, default=360)
    parser.add_argument(
        "--benchmark",
        default=None,
        help="Benchmark ticker. Defaults to CSI300ETF for Tencent or CSI300 for Eastmoney.",
    )
    parser.add_argument("--outputs-dir", default="outputs")
    parser.add_argument(
        "--variants",
        default="a",
        help=(
            "Strategy variants for the guarded daily run. Strict-radar A is the prospective default; "
            "the prior A/B experiment remains frozen unless a new experiment version is explicitly created."
        ),
    )
    parser.add_argument("--b-outputs-dir", default="outputs_b")
    parser.add_argument("--ab-outputs-dir", default="outputs_ab")
    parser.add_argument(
        "--ab-effective-signal-date",
        default=None,
        help="Prospective A/B start signal date. Used only when creating the experiment for the first time.",
    )
    parser.add_argument(
        "--ab-no-public-price-refresh",
        action="store_true",
        help="Do not refresh unadjusted public Tencent prices for the A/B paper ledger; intended for offline tests only.",
    )
    parser.add_argument("--run-dir", default=None, help="Optional clean data directory for this run.")
    parser.add_argument("--run-id", default=None, help="Immutable identifier for the generated Stock PDC run.")
    parser.add_argument("--as-of", default=None, help="Override output analysis date. Defaults to fetched latest date.")
    parser.add_argument("--skip-fetch", action="store_true", help="Validate and score an existing --run-dir.")
    parser.add_argument(
        "--zhuge-posture",
        choices=["aggressive", "balanced", "neutral", "conservative", "defensive"],
        default=None,
        help="Optional prospective Zhuge Orion posture for this run.",
    )
    parser.add_argument(
        "--zhuge-mode",
        choices=["manual", "close_tail_five_elements"],
        default=None,
        help="Optional automatic Zhuge posture source.",
    )
    parser.add_argument(
        "--zhuge-tail-decimals",
        type=int,
        choices=range(0, 7),
        default=None,
        help="Decimal precision used for the benchmark close tail digit.",
    )
    parser.add_argument(
        "--zhuge-weight",
        type=float,
        default=None,
        help="Experimental Zhuge weight from 0.00 to 0.05, funded from the Chair budget.",
    )
    parser.add_argument("--zhuge-bazi", default=None, help="Optional birth Bazi profile for Zhuge Orion.")
    parser.add_argument("--zhuge-fortune", default=None, help="Optional prospective fortune note for Zhuge Orion.")
    return parser


def _build_pdc_command(
    args: argparse.Namespace,
    data_dir: Path,
    universe_csv: Path,
    outputs_dir: Path,
    as_of: str,
) -> list[str]:
    command = [
        sys.executable,
        "scripts/run_pdc.py",
        "--top",
        str(args.top),
        "--as-of",
        as_of,
        "--data-dir",
        str(data_dir),
        "--metadata-csv",
        str(universe_csv),
        "--outputs-dir",
        str(outputs_dir),
        "--benchmark",
        str(args.benchmark),
        "--use-radar",
    ]
    for option, value in [
        ("--zhuge-posture", args.zhuge_posture),
        ("--zhuge-mode", args.zhuge_mode),
        ("--zhuge-tail-decimals", args.zhuge_tail_decimals),
        ("--zhuge-weight", args.zhuge_weight),
        ("--zhuge-bazi", args.zhuge_bazi),
        ("--zhuge-fortune", args.zhuge_fortune),
    ]:
        if value is not None:
            command.extend([option, str(value)])
    return command


def main() -> int:
    args = build_parser().parse_args()
    child_env = os.environ.copy()
    system_ca = Path("/etc/ssl/cert.pem")
    if "SSL_CERT_FILE" not in child_env and system_ca.exists():
        child_env["SSL_CERT_FILE"] = str(system_ca)
    variants = {value.strip().lower() for value in args.variants.split(",") if value.strip()}
    if not variants or not variants.issubset({"a", "b"}):
        raise SystemExit("--variants must be 'a' or 'a,b'")
    if "b" in variants and "a" not in variants:
        raise SystemExit("Strategy B requires same-run Strategy A scores; use --variants a,b")
    if "b" in variants:
        if args.zhuge_posture is not None or args.zhuge_bazi is not None or args.zhuge_fortune is not None:
            raise SystemExit("The frozen A/B experiment does not allow manual Zhuge posture, Bazi, or fortune inputs")
        if args.zhuge_mode not in (None, "close_tail_five_elements"):
            raise SystemExit("The frozen A/B experiment requires --zhuge-mode close_tail_five_elements")
        args.zhuge_mode = "close_tail_five_elements"
        if args.zhuge_tail_decimals is None:
            args.zhuge_tail_decimals = 3
        if args.zhuge_weight is None:
            args.zhuge_weight = 0.02
    benchmark = args.benchmark or ("CSI300ETF" if args.source == "tencent" else "CSI300")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_id = args.run_id or f"stock-pdc-{timestamp}"
    data_dir = _project_path(args.run_dir or f"data_a_share_latest_runs/run_{timestamp}")
    universe_csv = _project_path(f"outputs_a_share_latest_runs/run_{timestamp}/a_share_universe.csv")
    outputs_dir = _project_path(args.outputs_dir)

    if args.skip_fetch:
        if args.run_dir is None:
            raise SystemExit("--skip-fetch requires --run-dir")
        universe_csv = _project_path("outputs_a_share/a_share_universe.csv")
    else:
        fetch_cmd = [
            sys.executable,
            "scripts/fetch_a_share_eastmoney.py",
            "--data-dir",
            str(data_dir),
            "--universe-csv",
            str(universe_csv),
            "--source",
            args.source,
            "--bars",
            str(args.bars),
        ]
        subprocess.run(fetch_cmd, cwd=PROJECT_ROOT, check=True, env=child_env)

    latest_date = _validate_latest_data(data_dir, universe_csv, benchmark)
    if args.as_of is not None and args.as_of != latest_date:
        raise SystemExit(
            f"Guarded latest-data workflow requires --as-of to equal verified latest date {latest_date}; "
            "historical or backfilled B signals are not allowed"
        )
    as_of = args.as_of or latest_date
    args.benchmark = benchmark
    pdc_cmd = _build_pdc_command(args, data_dir, universe_csv, outputs_dir, as_of)
    subprocess.run(pdc_cmd, cwd=PROJECT_ROOT, check=True, env=child_env)
    if "b" in variants:
        b_cmd = [
            sys.executable,
            "scripts/run_pdc_b.py",
            "--data-dir",
            str(data_dir),
            "--metadata-csv",
            str(universe_csv),
            "--a-outputs-dir",
            str(outputs_dir),
            "--b-outputs-dir",
            str(_project_path(args.b_outputs_dir)),
            "--ab-outputs-dir",
            str(_project_path(args.ab_outputs_dir)),
            "--as-of",
            as_of,
            "--benchmark",
            benchmark,
            "--top",
            str(args.top),
            "--a-zhuge-mode",
            str(args.zhuge_mode),
            "--a-zhuge-weight",
            str(args.zhuge_weight),
            "--a-zhuge-tail-decimals",
            str(args.zhuge_tail_decimals),
        ]
        if args.ab_effective_signal_date is not None:
            b_cmd.extend(["--effective-signal-date", args.ab_effective_signal_date])
        if args.ab_no_public_price_refresh:
            b_cmd.extend(["--experiment-mode", "offline_test", "--no-public-price-refresh"])
        subprocess.run(b_cmd, cwd=PROJECT_ROOT, check=True, env=child_env)
    all_market_tickers, _ = _read_universe_dates(universe_csv)
    run_manifest = {
        "schema_version": "stock-pdc-automatic-run-v1",
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "analysis_date": as_of,
        "market_data_date": latest_date,
        "source": args.source,
        "source_scope": "full_a_share_market",
        "market_ticker_count": len(all_market_tickers),
        "hawkeye_rules": {
            "total_market_cap_cny_gt": HAWKEYE_MIN_MARKET_CAP_CNY,
            "return_60d_pct_gt": HAWKEYE_MIN_RETURN_60D_PCT,
        },
        "data_dir": str(data_dir),
        "universe_csv": str(universe_csv),
    }
    (outputs_dir / "automatic_run.json").write_text(
        json.dumps(run_manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    artifact_dir = stage_verified_run(outputs_dir, run_id, run_manifest)
    print(f"Latest market data verified: {latest_date}")
    print(f"Clean data directory: {data_dir}")
    print(f"Universe CSV: {universe_csv}")
    print(f"Automatic run manifest: {outputs_dir / 'automatic_run.json'}")
    print(f"Immutable run artifacts: {artifact_dir}")
    print(f"Strategy variants: {','.join(sorted(variants))}")
    if "b" in variants:
        print(f"Strategy B outputs: {_project_path(args.b_outputs_dir)}")
        print(f"A/B comparison: {_project_path(args.ab_outputs_dir) / 'summary.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
