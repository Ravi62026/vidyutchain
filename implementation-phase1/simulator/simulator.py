#!/usr/bin/env python3
"""Replay STPI-derived meter telemetry through the VidyutChain HTTP API."""

from __future__ import annotations

import argparse
import csv
import math
import sys
import time
from pathlib import Path
from typing import Iterator

import httpx

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET = PROJECT_ROOT / "stpi" / "meter_data_6months_20meters.csv"
TELEMETRY_PATH = "/api/telemetry"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:4000", help="Backend base URL")
    parser.add_argument("--token", required=True, help="JWT access token for telemetry ingestion")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET, help="CSV dataset to replay")
    parser.add_argument("--meter-id", action="append", dest="meter_ids", help="Meter ID to replay; repeat for multiple meters")
    parser.add_argument("--interval", type=float, default=15.0, help="Seconds between requests")
    parser.add_argument("--max-records", type=int, default=20, help="Maximum records to attempt")
    parser.add_argument("--max-retries", type=int, default=3, help="Retries for network/5xx failures")
    return parser.parse_args()


def parse_float(value: str | None) -> float | None:
    if value is None or value.strip() == "":
        return None

    number = float(value)
    return None if math.isnan(number) else number


def row_to_payload(row: dict[str, str]) -> dict[str, object] | None:
    power = parse_float(row.get("power"))
    voltage = parse_float(row.get("voltage"))
    current = parse_float(row.get("current"))
    power_factor = parse_float(row.get("power_factor"))
    consumption = parse_float(row.get("consumption_kwh"))

    if any(value is None for value in (power, voltage, current, power_factor, consumption)):
        return None

    is_reverse_energy = power < 0
    is_anomaly = row.get("is_anomaly") == "1"
    anomaly_type = row.get("anomaly_type", "NORMAL")

    return {
        "meterId": row["meter_id"].upper(),
        "timestamp": row["timestamp"],
        "voltage": voltage,
        "current": current,
        "powerKw": power,
        "powerFactor": power_factor,
        "importKwh": 0 if is_reverse_energy else max(consumption, 0),
        "exportKwh": abs(consumption) if is_reverse_energy else 0,
        "status": "anomaly" if is_anomaly else "normal",
        "source": "simulator",
        "anomalyType": anomaly_type if is_anomaly else "NORMAL",
    }


def read_rows(dataset: Path, meter_ids: set[str] | None = None) -> Iterator[dict[str, str]]:
    normalized_meter_ids = {meter_id.upper() for meter_id in meter_ids} if meter_ids else None
    with dataset.open("r", newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            if normalized_meter_ids and row["meter_id"].upper() not in normalized_meter_ids:
                continue
            yield row


def send_with_retries(
    client: httpx.Client,
    url: str,
    token: str,
    payload: dict[str, object],
    max_retries: int,
) -> bool:
    headers = {"Authorization": f"Bearer {token}"}

    for attempt in range(1, max_retries + 1):
        try:
            response = client.post(url, json=payload, headers=headers)
            if response.is_success:
                print(
                    f"sent meter={payload['meterId']} timestamp={payload['timestamp']} "
                    f"status={response.status_code}"
                )
                return True

            if response.status_code < 500:
                print(f"rejected meter={payload['meterId']} status={response.status_code} body={response.text}")
                return False

            print(f"server failure attempt={attempt}/{max_retries} status={response.status_code}")
        except httpx.HTTPError as error:
            print(f"request failure attempt={attempt}/{max_retries}: {error}")

        if attempt < max_retries:
            time.sleep(min(2**attempt, 8))

    print(f"giving up meter={payload['meterId']} timestamp={payload['timestamp']}")
    return False


def run(args: argparse.Namespace) -> int:
    if args.max_records < 1:
        raise ValueError("--max-records must be at least 1")
    if args.interval < 0:
        raise ValueError("--interval cannot be negative")

    meter_ids = {meter_id.upper() for meter_id in args.meter_ids} if args.meter_ids else None
    sent = 0
    skipped = 0
    failed = 0

    with httpx.Client(base_url=args.base_url.rstrip("/"), timeout=10.0) as client:
        for row in read_rows(args.dataset, meter_ids):
            if sent + skipped >= args.max_records:
                break

            payload = row_to_payload(row)
            if payload is None:
                skipped += 1
                print(f"skipped incomplete reading meter={row.get('meter_id')} timestamp={row.get('timestamp')}")
                continue

            if not send_with_retries(client, TELEMETRY_PATH, args.token, payload, args.max_retries):
                failed += 1

            sent += 1
            if sent + skipped < args.max_records and args.interval:
                time.sleep(args.interval)

    print(f"replay complete attempted={sent} skipped={skipped} failed={failed}")
    return 1 if failed else 0


def main() -> int:
    try:
        return run(parse_args())
    except (OSError, ValueError, httpx.InvalidURL) as error:
        print(f"simulator error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
