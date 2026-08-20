import asyncio
import unittest

from main import MODEL, PredictionRequest, health, predict, predict_reading


class AiServiceTests(unittest.TestCase):
    def normal_reading(self):
        return PredictionRequest(
            meterId="m001",
            timestamp="2026-08-20T12:00:00Z",
            voltage=231.2,
            current=4.2,
            powerKw=0.91,
            powerFactor=0.94,
            importKwh=0.2275,
            exportKwh=0,
        )

    def test_model_trains_on_expected_rows_and_classes(self):
        self.assertEqual(MODEL.training_rows, 10000)
        self.assertEqual(set(MODEL.classes), {
            "NORMAL",
            "LOAD_THEFT",
            "METER_TAMPERING",
            "REVERSE_ENERGY",
            "COMMUNICATION_FAILURE",
        })
        self.assertGreaterEqual(MODEL.accuracy, 0.8)
        self.assertGreaterEqual(MODEL.macro_f1, 0.7)

    def test_normal_reading_returns_prediction_contract(self):
        result = predict_reading(self.normal_reading())

        self.assertEqual(result.meter_id, "M001")
        self.assertIn(result.anomaly_type, MODEL.classes)
        self.assertGreaterEqual(result.risk_score, 0)
        self.assertLessEqual(result.risk_score, 1)
        self.assertTrue(result.reasons)

    def test_reverse_energy_is_deterministically_classified(self):
        payload = self.normal_reading().model_copy(update={
            "power_kw": -2.5,
            "import_kwh": 0,
            "export_kwh": 0.625,
        })
        result = predict_reading(payload)

        self.assertEqual(result.anomaly_type, "REVERSE_ENERGY")
        self.assertEqual(result.status, "anomaly")
        self.assertEqual(result.risk_score, 0.99)

    def test_missing_electrical_readings_are_communication_failure(self):
        result = predict_reading(PredictionRequest(meterId="M003"))

        self.assertEqual(result.anomaly_type, "COMMUNICATION_FAILURE")
        self.assertEqual(result.status, "communication_failure")

    def test_health_exposes_model_validation_metadata(self):
        result = asyncio.run(health())

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["trainingRows"], 10000)
        self.assertIn("macroF1", result["validation"])

    def test_predict_endpoint_returns_response_model(self):
        result = asyncio.run(predict(self.normal_reading()))

        self.assertEqual(result.model_version, "rf-stpi-v1")
        self.assertEqual(result.meter_id, "M001")


if __name__ == "__main__":
    unittest.main()
