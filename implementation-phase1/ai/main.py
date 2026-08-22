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


# --- Dynamic Solar Forecasting & Pricing Models ---

class PricePredictionRequest(BaseModel):
    energy_amount_kwh: float = Field(default=10.0, alias="energyAmountKwh", ge=0.1)
    hour: int = Field(default=12, ge=0, le=23)
    month: int = Field(default=8, ge=1, le=12)
    temperature_celsius: float = Field(default=28.0, alias="temperatureCelsius", ge=-20, le=60)
    cloud_coverage_percent: float = Field(default=15.0, alias="cloudCoveragePercent", ge=0, le=100)
    base_price_inr: float = Field(default=3.50, alias="basePriceInr", ge=0.5, le=50.0)


TIME_OF_DAY_FACTORS = {
    0: ("Night off-peak", 1.8),
    1: ("Night off-peak", 1.8),
    2: ("Night off-peak", 1.8),
    3: ("Night off-peak", 1.8),
    4: ("Night off-peak", 1.7),
    5: ("Early morning", 1.6),
    6: ("Early morning", 1.4),
    7: ("Morning transition", 1.25),
    8: ("Morning shoulder", 1.15),
    9: ("Peak solar approach", 1.05),
    10: ("Peak solar surplus", 0.90),
    11: ("Peak solar surplus", 0.88),
    12: ("Peak solar surplus", 0.85),
    13: ("Peak solar surplus", 0.88),
    14: ("Post-peak solar", 0.92),
    15: ("Afternoon shoulder", 1.10),
    16: ("Late afternoon", 1.25),
    17: ("Evening transition", 1.40),
    18: ("Evening peak demand", 1.65),
    19: ("Evening peak demand", 1.75),
    20: ("Night peak", 1.60),
    21: ("Night shoulder", 1.50),
    22: ("Night off-peak", 1.70),
    23: ("Night off-peak", 1.80),
}


@app.post("/predict-price")
async def predict_price(payload: PricePredictionRequest) -> dict[str, Any]:
    time_label, time_multiplier = TIME_OF_DAY_FACTORS.get(payload.hour, ("Standard", 1.0))

    # Temperature panel degradation: ~0.4% efficiency loss per degree above 25°C
    if payload.temperature_celsius <= 25:
        temp_efficiency = 1.0 + min(0.04, (25 - payload.temperature_celsius) * 0.002)
    else:
        temp_efficiency = max(0.78, 1.0 - (payload.temperature_celsius - 25) * 0.004)

    # Cloud factor: Irradiance reduction
    cloud_factor = max(0.20, 1.0 - (payload.cloud_coverage_percent / 100.0) * 0.70)
    estimated_irradiance = round(max(0.0, 1000.0 * cloud_factor * (1.0 if 6 <= payload.hour <= 18 else 0.0)), 1)

    # Combined dynamic tariff calculation
    suggested_price = payload.base_price_inr * time_multiplier * (1.0 / max(0.55, temp_efficiency * cloud_factor))
    suggested_price = round(max(1.50, min(12.00, suggested_price)), 2)

    total_value = round(suggested_price * payload.energy_amount_kwh, 2)

    # Standard physics rule-based advice
    fallback_advice = (
        "Optimal solar export window. High P2P liquidity."
        if 10 <= payload.hour <= 14
        else ("High demand peak hours. Premium pricing advised." if 18 <= payload.hour <= 21 else "Standard off-peak trading conditions.")
    )

    # Optional LLM-powered market reasoning (if OPENAI_API_KEY or GEMINI_API_KEY is configured)
    llm_advice = None
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if openai_key or gemini_key:
        import httpx
        prompt = (
            f"You are VidyutChain's AI Solar Grid Pricing Advisor. A prosumer is listing {payload.energy_amount_kwh} kWh of rooftop solar energy "
            f"at {payload.hour}:00 hours (Temp: {payload.temperature_celsius}°C, Cloud: {payload.cloud_coverage_percent}%). "
            f"Base tariff is ₹{payload.base_price_inr}/kWh and physics model calculated ₹{suggested_price}/kWh. "
            f"Give a concise 1-2 sentence prosumer trading advice on whether to sell now or store."
        )
        try:
            if openai_key:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [{"role": "user", "content": prompt}],
                            "max_tokens": 100,
                            "temperature": 0.3,
                        },
                    )
                    if res.status_code == 200:
                        llm_advice = res.json()["choices"][0]["message"]["content"].strip()
            elif gemini_key:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}",
                        headers={"Content-Type": "application/json"},
                        json={"contents": [{"parts": [{"text": prompt}]}]},
                    )
                    if res.status_code == 200:
                        llm_advice = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            llm_advice = None

    return {
        "suggestedPricePerKwh": suggested_price,
        "basePriceInr": payload.base_price_inr,
        "energyAmountKwh": payload.energy_amount_kwh,
        "totalEstimatedInr": total_value,
        "timeOfDayLabel": time_label,
        "estimatedIrradianceWm2": estimated_irradiance,
        "efficiencyMetrics": {
            "timeMultiplier": time_multiplier,
            "tempEfficiency": round(temp_efficiency, 3),
            "cloudFactor": round(cloud_factor, 3),
        },
        "marketAdvice": llm_advice or fallback_advice,
        "aiEngine": "LLM-Augmented (GPT/Gemini)" if llm_advice else "Physics-Informed ML (STPI v1)",
    }


# --- Carbon Offset & ESG Models ---

class CarbonOffsetRequest(BaseModel):
    energy_amount_kwh: float = Field(alias="energyAmountKwh", ge=0)
    source_type: str = Field(default="rooftop_solar", alias="sourceType")


@app.post("/calculate-carbon-offset")
async def calculate_carbon_offset(payload: CarbonOffsetRequest) -> dict[str, Any]:
    # Standard grid displacement factor in India: 0.85 kg CO2 per kWh
    CARBON_FACTOR_KG_PER_KWH = 0.85
    carbon_offset_kg = round(payload.energy_amount_kwh * CARBON_FACTOR_KG_PER_KWH, 3)
    trees_equivalent = round(carbon_offset_kg / 21.77, 2)

    return {
        "energyAmountKwh": payload.energy_amount_kwh,
        "carbonOffsetKg": carbon_offset_kg,
        "carbonOffsetTonnes": round(carbon_offset_kg / 1000.0, 4),
        "treesEquivalent": trees_equivalent,
        "factorUsed": CARBON_FACTOR_KG_PER_KWH,
        "sourceType": payload.source_type,
        "complianceStandard": "GHG Protocol Corporate Standard (Scope 2 Displacement)",
    }

