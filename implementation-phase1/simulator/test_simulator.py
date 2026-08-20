import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx

from simulator import read_rows, row_to_payload, send_with_retries


class FakeResponse:
    def __init__(self, status_code: int, text: str = ""):
        self.status_code = status_code
        self.text = text

    @property
    def is_success(self) -> bool:
        return 200 <= self.status_code < 300


class FakeClient:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.requests = []

    def post(self, url, json, headers):
        self.requests.append((url, json, headers))
        response = next(self.responses)
        if isinstance(response, Exception):
            raise response
        return response


class SimulatorTests(unittest.TestCase):
    def test_normal_row_maps_to_import_energy(self):
        row = {
            "meter_id": "m001",
            "timestamp": "2006-12-16 17:15:00",
            "voltage": "234.36",
            "current": "19.7",
            "power": "4.58",
            "power_factor": "0.98",
            "consumption_kwh": "1.14",
            "is_anomaly": "0",
            "anomaly_type": "NORMAL",
        }

        payload = row_to_payload(row)

        self.assertIsNotNone(payload)
        self.assertEqual(payload["meterId"], "M001")
        self.assertEqual(payload["importKwh"], 1.14)
        self.assertEqual(payload["exportKwh"], 0)
        self.assertEqual(payload["anomalyType"], "NORMAL")
        self.assertEqual(payload["status"], "normal")

    def test_reverse_energy_maps_to_export_energy(self):
        row = {
            "meter_id": "M002",
            "timestamp": "2006-12-16 17:15:00",
            "voltage": "230",
            "current": "5",
            "power": "-2.5",
            "power_factor": "-0.8",
            "consumption_kwh": "0.625",
            "is_anomaly": "1",
            "anomaly_type": "REVERSE_ENERGY",
        }

        payload = row_to_payload(row)

        self.assertEqual(payload["importKwh"], 0)
        self.assertEqual(payload["exportKwh"], 0.625)
        self.assertEqual(payload["anomalyType"], "REVERSE_ENERGY")
        self.assertEqual(payload["status"], "anomaly")

    def test_incomplete_row_is_skipped(self):
        row = {
            "meter_id": "M003",
            "timestamp": "2006-12-16 17:15:00",
            "voltage": "230",
            "current": "",
            "power": "2.5",
            "power_factor": "0.8",
            "consumption_kwh": "0.625",
        }

        self.assertIsNone(row_to_payload(row))

    def test_read_rows_filters_meter_ids_case_insensitively(self):
        with tempfile.TemporaryDirectory() as directory:
            dataset = Path(directory) / "telemetry.csv"
            dataset.write_text(
                "meter_id,timestamp\nM001,2026-01-01T00:00:00Z\nM002,2026-01-01T00:15:00Z\n",
                encoding="utf-8",
            )

            rows = list(read_rows(dataset, {"m002"}))

        self.assertEqual([row["meter_id"] for row in rows], ["M002"])

    def test_server_failures_are_retried(self):
        client = FakeClient([FakeResponse(503), FakeResponse(201)])
        payload = {"meterId": "M001", "timestamp": "2026-01-01T00:00:00Z"}

        with patch("simulator.time.sleep") as sleep:
            result = send_with_retries(client, "/api/telemetry", "token", payload, 2)

        self.assertTrue(result)
        self.assertEqual(len(client.requests), 2)
        self.assertEqual(client.requests[0][2], {"Authorization": "Bearer token"})
        sleep.assert_called_once_with(2)

    def test_network_failures_are_retried(self):
        client = FakeClient([httpx.ConnectError("offline"), FakeResponse(201)])
        payload = {"meterId": "M001", "timestamp": "2026-01-01T00:00:00Z"}

        with patch("simulator.time.sleep"):
            result = send_with_retries(client, "/api/telemetry", "token", payload, 2)

        self.assertTrue(result)
        self.assertEqual(len(client.requests), 2)


if __name__ == "__main__":
    unittest.main()
