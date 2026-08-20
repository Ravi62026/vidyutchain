# Meter Simulator

The simulator replays the STPI dataset as real HTTP telemetry from 20 virtual meters. It must send data through the backend API rather than writing directly to MongoDB.

Planned capabilities:

- Configurable replay interval
- Deterministic meter selection
- Normal and anomaly replay modes
- Retry and connection-failure logging
- Import/export telemetry mapping
