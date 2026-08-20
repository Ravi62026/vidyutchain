# VidyutChain AI Service

The Python/FastAPI service owns feature preparation, anomaly classification, risk scoring, and forecasting. It is called by the Node.js backend and does not own users, telemetry persistence, or blockchain writes.

## Local run

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The FastAPI application is served by Uvicorn. Its interactive API documentation is available at `http://127.0.0.1:8000/docs` and the service health check is available at `http://127.0.0.1:8000/health`.

## Inference API

The service trains a reproducible RandomForest model from `stpi/meter_data_6months_20meters.csv` when it starts. The model uses voltage, current, signed power, power factor, consumption, and hour features. Missing electrical readings are classified as `COMMUNICATION_FAILURE`; negative power or export energy is classified deterministically as `REVERSE_ENERGY`.

### `GET /health`

Returns the model version, training-row count, supported classes, validation accuracy, and macro-F1 score.

### `POST /predict`

Example request:

```json
{
	"meterId": "M001",
	"timestamp": "2026-08-20T12:00:00Z",
	"voltage": 231.2,
	"current": 4.2,
	"powerKw": -2.5,
	"powerFactor": 0.94,
	"importKwh": 0,
	"exportKwh": 0.625
}
```

The response contains `anomalyType`, `status`, `riskScore`, `confidence`, `modelVersion`, and human-readable `reasons`. The Node.js backend calls this endpoint after telemetry validation, stores the AI metadata separately from the simulator's source label, and creates an alert for non-normal predictions. A temporary AI outage does not discard valid telemetry.
