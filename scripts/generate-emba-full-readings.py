#!/usr/bin/env python3
"""Build page-aware English reading files from the September course PDFs."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from pypdf import PdfReader
import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
READINGS_DIR = ROOT / "emba/materials/2026-09/readings"
OUTPUT_DIR = ROOT / "emba/reading-texts"

SOURCES = {
    "stulz-risk-management": {
        "file": "Rethinking-Risk-Management-1cnhar7.pdf",
        "scope": "Complete article · 17 PDF pages",
    },
    "nocco-stulz-erm": {
        "file": "Nocco-Stulz-2006-Enterprise-Risk-Management-Journal.pdf",
        "scope": "Complete article · 15 PDF pages",
    },
    "ewing-volkswagen": {
        "file": "Engineering a Deception - Volkswagen Diesel Scandal - NYT.pdf",
        "scope": "Complete saved article · 4 PDF pages",
    },
    "ing-compliance": {
        "file": "ING pays fine of EUR 775 mio for non-compliance with Wwft legislation.pdf",
        "scope": "Complete settlement announcement · 4 PDF pages",
    },
    "de-micco-estra": {
        "file": "db0a04896984cd13a381b47221bd1f3a883b.pdf",
        "scope": "Complete article · 19 PDF pages",
    },
    "kpmg-esrs": {
        "file": "esrs-learnings-to-progress-2025-kpmg-netherlands.pdf",
        "scope": "Complete report · 23 PDF pages",
    },
    "coso-executive-summary": {
        "file": "2017-COSO-ERM-Integrating-with-Strategy-and-Performance-Executive-Summary (1).pdf",
        "scope": "Complete executive summary · 16 PDF pages",
    },
    "grant-thornton-risk-frameworks": {
        "file": "ERM_Grant Thorton_2017-Risk Frameworks.pdf",
        "scope": "Complete report · 12 PDF pages",
    },
    "deloitte-non-financial-risk": {
        "file": "lu-managing-non-financial-risk-31082017.pdf",
        "scope": "Complete report · 13 PDF pages",
    },
    "dsm-governance-risk": {
        "file": "dsm-integrated-annual-report-2021.pdf",
        "first_page": 124,
        "last_page": 147,
        "printed_first_page": 123,
        "scope": "Syllabus-required pages 123–146 · 24 pages",
    },
    "otten-schweitzer-mutual-funds": {
        "file": "guid-bb9aa06f-4ab8-449c-988f-924ce20150d7-ASSET1.0.pdf",
        "scope": "Complete article · 22 PDF pages",
    },
    "tennessee-controls": {
        "file": "Tennessee Controls.pdf",
        "scope": "Complete case · 17 OCR pages",
        "ocr": True,
    },
}

REPEATED_LINE_PATTERNS = [
    re.compile(r"^\d+$"),
    re.compile(r"^VOLUME \d+ NUMBER \d+", re.I),
    re.compile(r"^JOURNAL OF APPLIED CORPORATE FINANCE$", re.I),
    re.compile(r"^Royal DSM Integrated Annual Report 2021$", re.I),
    re.compile(r"^© 20\d{2} Harvard Business School", re.I),
]


def clean_line(line: str) -> str:
    line = line.replace("\u00ad", "").replace("\u200b", "")
    line = re.sub(r"\s+", " ", line).strip()
    if any(pattern.search(line) for pattern in REPEATED_LINE_PATTERNS):
        return ""
    return line


def normalize_page_text(text: str) -> str:
    lines = [clean_line(line) for line in text.splitlines()]
    lines = [line for line in lines if line]
    joined = "\n".join(lines)
    joined = re.sub(r"(?<=[A-Za-z])-[ \t]*\n(?=[a-z])", "", joined)
    joined = re.sub(r"\n", " ", joined)
    joined = re.sub(r"\s+", " ", joined).strip()
    return joined


def split_sentences(text: str) -> list[str]:
    if not text:
        return []
    pieces = re.split(r"(?<=[.!?])\s+(?=(?:[A-Z0-9]|[\"“‘(]))", text)
    return [piece.strip() for piece in pieces if piece.strip()]


def split_oversized(text: str, limit: int = 1250) -> list[str]:
    if len(text) <= limit:
        return [text]
    words = text.split()
    chunks: list[str] = []
    current: list[str] = []
    size = 0
    for word in words:
        extra = len(word) + (1 if current else 0)
        if current and size + extra > limit:
            chunks.append(" ".join(current))
            current = [word]
            size = len(word)
        else:
            current.append(word)
            size += extra
    if current:
        chunks.append(" ".join(current))
    return chunks


def paragraph_chunks(text: str, target: int = 760, maximum: int = 1250) -> list[str]:
    sentences = split_sentences(text)
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        for piece in split_oversized(sentence, maximum):
            candidate = f"{current} {piece}".strip()
            if current and len(candidate) > target:
                chunks.append(current)
                current = piece
            else:
                current = candidate
    if current:
        chunks.append(current)
    return [chunk for chunk in chunks if len(chunk) >= 20]


def extracted_pages(config: dict) -> list[dict]:
    reader = PdfReader(str(READINGS_DIR / config["file"]))
    first_page = config.get("first_page", 1)
    last_page = config.get("last_page", len(reader.pages))
    printed_first = config.get("printed_first_page", first_page)
    pages = []
    for pdf_page in range(first_page, last_page + 1):
        text = reader.pages[pdf_page - 1].extract_text() or ""
        pages.append({
            "pdfPage": pdf_page,
            "page": printed_first + (pdf_page - first_page),
            "text": text,
        })
    return pages


def column_text(page, bbox: tuple[float, float, float, float]) -> str:
    """Extract one physical PDF column in visual reading order.

    pypdf's default extractor follows the PDF drawing order.  That order is
    not the reading order in Stulz (1996): it interleaves the two columns on
    each page.  Grouping words into visual lines inside an explicit crop gives
    us left-column top-to-bottom, followed by right-column top-to-bottom.
    """
    words = page.crop(bbox).extract_words(x_tolerance=1, y_tolerance=3)
    lines: list[list[dict]] = []
    for word in sorted(words, key=lambda item: (item["top"], item["x0"])):
        if not lines or abs(word["top"] - lines[-1][0]["top"]) > 3:
            lines.append([word])
        else:
            lines[-1].append(word)
    rendered_lines: list[str] = []
    for line in lines:
        line_text = " ".join(item["text"] for item in sorted(line, key=lambda item: item["x0"]))
        # Journal citations sit below the article body.  They are not part of
        # the paragraph that continues in the next column.
        if line[0]["top"] > 600 and re.match(r"^(?:\*|\d+\.)", line_text):
            break
        rendered_lines.append(line_text)
    return "\n".join(rendered_lines)


def stulz_pages(config: dict) -> list[dict]:
    """Read the Stulz article from its two-column magazine layout.

    The printed article uses the left column first, then the right column.
    Headers, footnotes, and page furniture sit outside the body crop.  Page 1
    has a title block, so its body starts lower than the remaining pages.
    """
    source = READINGS_DIR / config["file"]
    pages: list[dict] = []
    with pdfplumber.open(source) as pdf:
        for pdf_page, page in enumerate(pdf.pages, start=1):
            body_top = 250 if pdf_page == 1 else 100
            # Later pages put notes below the article body.  Keeping the crop
            # above them prevents a footnote from being inserted between the
            # left column's last line and the right column's continuation.
            body_bottom = 700
            left = column_text(page, (40, body_top, 302, body_bottom))
            right = column_text(page, (310, body_top, 575, body_bottom))
            text = f"{left}\n{right}".strip()
            if pdf_page == 1:
                # The decorative drop cap is extracted on its own visual line.
                text = re.sub(r"^his article explores", "This article explores", text)
                text = text.replace("conflict\nT\nbetween", "conflict\nbetween")
            pages.append({"pdfPage": pdf_page, "page": pdf_page, "text": text})
    return pages


def ocr_pages(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [{"pdfPage": item["page"], "page": item["page"], "text": item["text"]} for item in data]


def build_reading(reading_id: str, config: dict, ocr_path: Path | None) -> dict:
    if config.get("ocr"):
        if not ocr_path or not ocr_path.exists():
            raise SystemExit("Tennessee OCR JSON is required; pass --tennessee-ocr PATH")
        pages = ocr_pages(ocr_path)
    elif reading_id == "stulz-risk-management":
        pages = stulz_pages(config)
    else:
        pages = extracted_pages(config)

    paragraphs = []
    for page in pages:
        cleaned = normalize_page_text(page["text"])
        if reading_id == "stulz-risk-management" and page["pdfPage"] == 1:
            cleaned = cleaned.replace("apparent conflict T between", "apparent conflict between")
        for sequence, text in enumerate(paragraph_chunks(cleaned), start=1):
            paragraphs.append({
                "page": page["page"],
                "pdfPage": page["pdfPage"],
                "sequence": sequence,
                "label": f"p. {page['page']}",
                "en": text,
            })

    return {
        "id": reading_id,
        "sourceFile": config["file"],
        "scope": config["scope"],
        "pageCount": len(pages),
        "paragraphCount": len(paragraphs),
        "characterCount": sum(len(item["en"]) for item in paragraphs),
        "paragraphs": paragraphs,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tennessee-ocr", type=Path)
    parser.add_argument("--reading", choices=sorted(SOURCES), help="Regenerate one reading only")
    args = parser.parse_args()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    selected = {args.reading: SOURCES[args.reading]} if args.reading else SOURCES
    existing_index = {"readings": []}
    index_path = OUTPUT_DIR / "index.json"
    if args.reading and index_path.exists():
        existing_index = json.loads(index_path.read_text(encoding="utf-8"))
    refreshed_index: dict[str, dict] = {}
    for entry in existing_index.get("readings", []):
        if entry.get("id") not in selected:
            refreshed_index[entry["id"]] = entry
    for reading_id, config in selected.items():
        payload = build_reading(reading_id, config, args.tennessee_ocr)
        output_path = OUTPUT_DIR / f"{reading_id}.json"
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        refreshed_index[reading_id] = {key: payload[key] for key in (
            "id", "scope", "pageCount", "paragraphCount", "characterCount"
        )}
        print(f"{reading_id}: {payload['pageCount']} pages, {payload['paragraphCount']} paragraphs")
    index = {"readings": [refreshed_index[reading_id] for reading_id in SOURCES if reading_id in refreshed_index]}
    (OUTPUT_DIR / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
