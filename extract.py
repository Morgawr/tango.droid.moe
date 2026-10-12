#!/usr/bin/env python3
"""
extract.py: Reads michadame's SQLite bank.db in read-only mode,
converts in-game screenshots to optimized WebP images,
and compiles structured JSON datasets for tango.droid.moe.
"""

import sqlite3
import json
import os
import io
import datetime
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path.home() / ".config/michadame/bank/bank.db"
MEDIA_DIR = BASE_DIR / "public/media"
DATA_DIR = BASE_DIR / "src/data"
WORKS_FILE = BASE_DIR / "works.json"

MEDIA_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Load known works metadata
known_works = {}
if WORKS_FILE.exists():
    with open(WORKS_FILE, "r", encoding="utf-8") as f:
        known_works = json.load(f)

if not DB_PATH.exists():
    print(f"Error: Database not found at {DB_PATH}")
    exit(1)

# Connect in read-only mode
conn = sqlite3.connect(f"file:{DB_PATH.resolve()}?mode=ro", uri=True)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Check for twitch_clip_url column
cursor.execute("PRAGMA table_info(mined_words)")
columns = [col["name"] for col in cursor.fetchall()]
has_clip_col = "twitch_clip_url" in columns

query = f"""
    SELECT id, created_at, term, reading, definition_text, definition_json,
           sentence, word_start, word_end, source_text, tag,
           screenshot, thumbnail
           {', twitch_clip_url' if has_clip_col else ''}
    FROM mined_words
    ORDER BY created_at DESC, id DESC
"""
cursor.execute(query)
rows = cursor.fetchall()
print(f"[*] Found {len(rows)} entries in bank.db")

words_data = []
stats_by_work = {}

for row in rows:
    entry_id = row["id"]
    created_at = row["created_at"]
    term = row["term"]
    reading = row["reading"]
    sentence = row["sentence"]
    word_start = row["word_start"]
    word_end = row["word_end"]
    tag = row["tag"] or "Untagged"
    clip_url = row["twitch_clip_url"] if has_clip_col else None
    
    # Format date string
    dt = datetime.datetime.fromtimestamp(created_at / 1000.0, tz=datetime.timezone.utc)
    date_formatted = dt.strftime("%Y-%m-%d")

    # Image conversion to WebP
    screen_rel_path = None
    thumb_rel_path = None

    if row["screenshot"]:
        screen_file = MEDIA_DIR / f"{entry_id}.webp"
        if not screen_file.exists():
            try:
                img = Image.open(io.BytesIO(row["screenshot"]))
                img.save(screen_file, "WEBP", quality=82, method=6)
            except Exception as e:
                print(f"Warning: Failed to convert screenshot for #{entry_id}: {e}")
        screen_rel_path = f"/media/{entry_id}.webp"

    if row["thumbnail"]:
        thumb_file = MEDIA_DIR / f"{entry_id}_thumb.webp"
        if not thumb_file.exists():
            try:
                thumb = Image.open(io.BytesIO(row["thumbnail"]))
                thumb.save(thumb_file, "WEBP", quality=80)
            except Exception as e:
                print(f"Warning: Failed to convert thumbnail for #{entry_id}: {e}")
        thumb_rel_path = f"/media/{entry_id}_thumb.webp"
    elif screen_rel_path:
        thumb_rel_path = screen_rel_path

    # Parse rich definition
    parsed_json = {}
    frequency_rank = None
    if row["definition_json"]:
        try:
            parsed_json = json.loads(row["definition_json"])
            if isinstance(parsed_json, dict) and "frequency" in parsed_json:
                freq = parsed_json.get("frequency")
                if isinstance(freq, dict) and "rank" in freq:
                    frequency_rank = freq.get("rank")
        except Exception:
            parsed_json = {}

    # Parse definitions / glossaries
    definitions = []
    def_text = row["definition_text"] or ""
    # Extract plain numbered lines if available
    lines = [line.strip() for line in def_text.split("\n") if line.strip()]
    if lines:
        definitions = lines
    else:
        definitions = [def_text]

    # Resolve work metadata
    work_meta = known_works.get(tag, {
        "slug": tag,
        "vndbId": None,
    })

    # Track stats
    if tag not in stats_by_work:
        stats_by_work[tag] = {
            "tag": tag,
            "slug": work_meta.get("slug", tag),
            "vndbId": work_meta.get("vndbId"),
            "wordCount": 0,
            "clipCount": 0,
        }
    stats_by_work[tag]["wordCount"] += 1
    if clip_url:
        stats_by_work[tag]["clipCount"] += 1

    word_entry = {
        "id": entry_id,
        "kind": "vocab",
        "createdAt": created_at,
        "dateFormatted": date_formatted,
        "term": term,
        "reading": reading,
        "pitchAccent": None, # Ready for future rollout
        "frequencyRank": frequency_rank,
        "definitionText": def_text,
        "definitions": definitions,
        "sentence": sentence,
        "wordRange": [word_start, word_end],
        "tag": tag,
        "workSlug": work_meta.get("slug", tag),
        "hasScreenshot": bool(screen_rel_path),
        "screenshotUrl": screen_rel_path,
        "thumbnailUrl": thumb_rel_path,
        "twitchClipUrl": clip_url,
    }
    words_data.append(word_entry)

# Write words.json
with open(DATA_DIR / "words.json", "w", encoding="utf-8") as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

# Write works.json
works_list = list(stats_by_work.values())
works_list.sort(key=lambda w: w["wordCount"], reverse=True)
with open(DATA_DIR / "works.json", "w", encoding="utf-8") as f:
    json.dump(works_list, f, ensure_ascii=False, indent=2)

print(f"[✓] Extracted {len(words_data)} entries across {len(works_list)} works.")
print(f"[✓] Data written to {DATA_DIR}/words.json and {DATA_DIR}/works.json")
