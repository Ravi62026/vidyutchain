"""VidyutChain anomaly inference service."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET = PROJECT_ROOT / "stpi" / "meter_data_6months_20meters.csv"
MODEL_VERSION = "rf-stpi-v1"
FEATURE_COLUMNS = ["voltage", "current", "power", "power_factor", "consumption_kwh", "hour"]


class PredictionRequest(BaseModel):
    """Telemetry fields accepted from the Node.js backend."""

    model_config = ConfigDict(populate_by_name=True)

    meter_id: str = Field(alias="meterId", min_length=3, max_length=64)
    timestamp: datetime | None = None
    voltage: float | None = Field(default=None, ge=0, le=500)
    current: float | None = Field(default=None, ge=0, le=1000)
    power_kw: float | None = Field(default=None, alias="powerKw", ge=-1000, le=1000)
    power_factor: float | None = Field(default=None, alias="powerFactor", ge=-1, le=1)
    import_kwh: float = Field(default=0, alias="importKwh", ge=0)
    export_kwh: float = Field(default=0, alias="exportKwh", ge=0)
    hour: int | None = Field(default=None, ge=0, le=23)


class PredictionResponse(BaseModel):
    meter_id: str = Field(alias="meterId")
    model_version: str = Field(alias="modelVersion")
    anomaly_type: str = Field(alias="anomalyType")
    status: str
    risk_score: float = Field(alias="riskScore")
    confidence: float
    reasons: list[str]


@dataclass(frozen=True)
class ModelBundle:
    pipeline: Pipeline
    classes: tuple[str, ...]
    training_rows: int
    accuracy: float
    macro_f1: float


def dataset_path() -> Path:
    configured_path = os.getenv("AI_DATASET_PATH")
    return Path(configured_path) if configured_path else DEFAULT_DATASET


def train_model() -> ModelBundle:
    path = dataset_path()
    if not path.exists():
        raise FileNotFoundError(f"AI dataset not found: {path}")

    data = pd.read_csv(path)
    required_columns = set(FEATURE_COLUMNS + ["anomaly_type"])
    missing_columns = required_columns - set(data.columns)
    if missing_columns:
        raise ValueError(f"AI dataset is missing columns: {sorted(missing_columns)}")

    features = data[FEATURE_COLUMNS].copy()
    labels = data["anomaly_type"].replace({"COMM_FAILURE": "COMMUNICATION_FAILURE"})
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels,
    )

    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=120,
                random_state=42,
                class_weight="balanced_subsample",
                min_samples_leaf=2,
                n_jobs=-1,
            ),
        ),
    ])
    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)
    classifier = pipeline.named_steps["classifier"]

    return ModelBundle(
        pipeline=pipeline,
        classes=tuple(str(value) for value in classifier.classes_),
        training_rows=len(data),
        accuracy=float(accuracy_score(y_test, predictions)),
        macro_f1=float(f1_score(y_test, predictions, average="macro")),
    )


MODEL = train_model()

app = FastAPI(
    title="VidyutChain AI Service",
    version="0.1.0",
    description="Anomaly detection and energy intelligence service for VidyutChain.",
)


def feature_row(payload: PredictionRequest) -> pd.DataFrame:
    hour = payload.hour if payload.hour is not None else payload.timestamp.hour if payload.timestamp else 0
    consumption = payload.import_kwh + payload.export_kwh
    return pd.DataFrame([{
        "voltage": payload.voltage,
        "current": payload.current,
        "power": payload.power_kw,
        "power_factor": payload.power_factor,
        "consumption_kwh": consumption,
        "hour": hour,
    }], columns=FEATURE_COLUMNS)


def explain(anomaly_type: str) -> list[str]:
    if anomaly_type == "COMMUNICATION_FAILURE":
        return ["one or more electrical readings are missing"]
    if anomaly_type == "REVERSE_ENERGY":
        return ["signed power or export energy indicates reverse energy flow"]
    if anomaly_type == "METER_TAMPERING":
        return ["electrical values are outside the learned meter profile"]
    if anomaly_type == "LOAD_THEFT":
        return ["the learned consumption profile indicates a theft-like deviation"]
    return ["reading is consistent with the learned normal profile"]


def predict_reading(payload: PredictionRequest) -> PredictionResponse:
    missing_reading = any(
        value is None for value in (payload.voltage, payload.current, payload.power_kw, payload.power_factor)
    )

    if missing_reading:
        anomaly_type = "COMMUNICATION_FAILURE"
        confidence = 0.99
    elif payload.power_kw < 0 or payload.export_kwh > 0:
        anomaly_type = "REVERSE_ENERGY"
        confidence = 0.99
    else:
        probabilities = MODEL.pipeline.predict_proba(feature_row(payload))[0]
        best_index = int(probabilities.argmax())
        anomaly_type = MODEL.classes[best_index]
        confidence = float(probabilities[best_index])

    risk_score = confidence if anomaly_type != "NORMAL" else 1.0 - confidence
    status = "normal" if anomaly_type == "NORMAL" else (
        "communication_failure" if anomaly_type == "COMMUNICATION_FAILURE" else "anomaly"
    )

    return PredictionResponse(
        meterId=payload.meter_id.upper(),
        modelVersion=MODEL_VERSION,
        anomalyType=anomaly_type,
        status=status,
        riskScore=round(max(0.0, min(1.0, risk_score)), 4),
        confidence=round(max(0.0, min(1.0, confidence)), 4),
        reasons=explain(anomaly_type),
    )


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "service": "vidyutchain-ai",
        "status": "ok",
        "modelVersion": MODEL_VERSION,
        "trainingRows": MODEL.training_rows,
        "classes": MODEL.classes,
        "validation": {
            "accuracy": round(MODEL.accuracy, 4),
            "macroF1": round(MODEL.macro_f1, 4),
        },
    }


@app.get("/model")
async def model_metadata() -> dict[str, Any]:
    return await health()


@app.post("/predict", response_model=PredictionResponse)
async def predict(payload: PredictionRequest) -> PredictionResponse:
    try:
        return predict_reading(payload)
    except (ValueError, TypeError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
