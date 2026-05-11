import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path


os.environ.setdefault("MYSQL_HOST", "127.0.0.1")
os.environ.setdefault("MYSQL_PORT", "3306")
os.environ.setdefault("MYSQL_USER", "homepage_user")
os.environ.setdefault("MYSQL_PASSWORD", "123456")
os.environ.setdefault("PROFILE_MYSQL_DATABASE", "personal_homepage_profiles")

from server import (  # noqa: E402
    MYSQL_DATABASE,
    MYSQL_TABLE,
    apply_gender_pronouns,
    ensure_database_ready,
    fetch_all,
    get_site_data_gender,
    load_json_field,
    mysql_connection,
    restore_cached_translation,
    summarize_translation_cache,
)


DEFAULT_OUTPUT = Path("data") / "profiles.json"


def json_text(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def load_topics(value):
    if isinstance(value, str) and value:
        return json.loads(value)
    return value or []


def export_translations(profile_data, translations):
    exported = {}
    for key, entry in (translations or {}).items():
        if not isinstance(entry, dict):
            continue

        cached_site_data = entry.get("site_data", entry)
        restored = restore_cached_translation(profile_data, cached_site_data)
        target_language = "Simplified Chinese" if key == "zh" else key
        restored = apply_gender_pronouns(restored, get_site_data_gender(profile_data), target_language)
        exported[key] = {
            "site_data": restored,
            "updated_at": entry.get("updated_at", ""),
        }
    return exported


def fetch_profile_ids():
    connection = mysql_connection(MYSQL_DATABASE)
    try:
        cursor = connection.cursor()
        try:
            cursor.execute(
                f"""
                SELECT id
                FROM `{MYSQL_TABLE}`
                ORDER BY pinned_at IS NULL, pinned_at DESC, updated_at DESC
                """
            )
            rows = fetch_all(cursor)
        finally:
            cursor.close()
    finally:
        connection.close()

    return [row.get("id") if isinstance(row, dict) else row[0] for row in rows]


def fetch_profile(profile_id):
    connection = mysql_connection(MYSQL_DATABASE)
    try:
        cursor = connection.cursor()
        try:
            cursor.execute(
                f"""
                SELECT id, name, role, summary, topics_json, profile_json, translations_json, pinned_at, updated_at
                FROM `{MYSQL_TABLE}`
                WHERE id = %s
                """,
                (profile_id,),
            )
            row = cursor.fetchone()
        finally:
            cursor.close()
    finally:
        connection.close()

    if not row:
        return None

    if not isinstance(row, dict):
        row = {
            "id": row[0],
            "name": row[1],
            "role": row[2],
            "summary": row[3],
            "topics_json": row[4],
            "profile_json": row[5],
            "translations_json": row[6],
            "pinned_at": row[7],
            "updated_at": row[8],
        }

    profile_data = load_json_field(row.get("profile_json"), {})
    translations = load_json_field(row.get("translations_json"), {})
    full_translations = export_translations(profile_data, translations)

    return {
        "id": row["id"],
        "name": row["name"],
        "role": row["role"],
        "summary": row.get("summary") or "",
        "topics": load_topics(row.get("topics_json")),
        "data": profile_data,
        "translations": full_translations,
        "translation_summaries": summarize_translation_cache(full_translations),
        "is_pinned": bool(row.get("pinned_at")),
        "pinned_at": str(row["pinned_at"]) if row.get("pinned_at") else "",
        "updated_at": str(row["updated_at"]) if row.get("updated_at") else "",
    }


def export_static(output_path):
    ensure_database_ready()
    profiles = []
    for profile_id in fetch_profile_ids():
        profile = fetch_profile(profile_id)
        if profile:
            profiles.append(profile)

    payload = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "source": "local-mysql-export",
        "profiles": profiles,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def main():
    parser = argparse.ArgumentParser(description="Export local MySQL profiles for GitHub Pages static hosting.")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Output JSON path. Default: data/profiles.json",
    )
    args = parser.parse_args()

    output_path = Path(args.output)
    payload = export_static(output_path)
    print(f"Exported {len(payload['profiles'])} profiles to {output_path}")


if __name__ == "__main__":
    main()
