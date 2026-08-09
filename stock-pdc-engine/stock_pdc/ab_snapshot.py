from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_a_score_rows(path: Path, analysis_date: str) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValueError(f"A score file is empty: {path}")
    dates = {row.get("analysis_date", "") for row in rows}
    if dates != {analysis_date}:
        raise ValueError(f"A score dates {sorted(dates)} do not match {analysis_date}")
    tickers = [row.get("ticker", "") for row in rows]
    if len(tickers) != len(set(tickers)):
        raise ValueError("A score file contains duplicate tickers")
    return rows


def build_snapshot_manifest(
    data_dir: Path,
    metadata_csv: Path,
    a_score_csv: Path,
    analysis_date: str,
    benchmark: str,
) -> dict[str, object]:
    score_rows = read_a_score_rows(a_score_csv, analysis_date)
    score_tickers = sorted(str(row["ticker"]) for row in score_rows)
    files = [metadata_csv, a_score_csv, data_dir / f"{benchmark}.csv"] + [
        data_dir / f"{ticker}.csv" for ticker in score_tickers
    ]
    missing = [str(path) for path in files if not path.exists()]
    if missing:
        raise ValueError(f"Snapshot inputs missing: {', '.join(missing[:10])}")
    file_hashes = {path.name: _sha256(path) for path in files}
    combined = hashlib.sha256()
    for name in sorted(file_hashes):
        combined.update(name.encode("utf-8"))
        combined.update(b"\0")
        combined.update(file_hashes[name].encode("ascii"))
        combined.update(b"\n")
    snapshot_id = combined.hexdigest()
    return {
        "analysisDate": analysis_date,
        "benchmark": benchmark,
        "scoredTickerCount": len(score_tickers),
        "scoredTickers": score_tickers,
        "snapshotId": snapshot_id,
        "fileHashes": file_hashes,
    }


def freeze_snapshot_manifest(root: Path, manifest: dict[str, object]) -> Path:
    analysis_date = str(manifest["analysisDate"])
    path = root / "run_manifests" / f"snapshot_{analysis_date}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        with path.open("r", encoding="utf-8") as handle:
            existing = json.load(handle)
        if existing.get("snapshotId") != manifest.get("snapshotId"):
            raise ValueError(
                f"Snapshot {analysis_date} is already frozen as {existing.get('snapshotId')}; "
                "refusing to revise the prospective A/B signal"
            )
        return path
    with path.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return path


def policy_hash(paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths, key=lambda item: str(item)):
        digest.update(str(path.name).encode("utf-8"))
        digest.update(b"\0")
        digest.update(_sha256(path).encode("ascii"))
        digest.update(b"\n")
    return digest.hexdigest()
