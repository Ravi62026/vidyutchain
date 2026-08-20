# Day 1 Acceptance Criteria

**Current status:** `BLOCKED` pending a reachable MongoDB instance and live end-to-end evidence.

See [Day 1 evidence runbook](day1-evidence-runbook.md) for the reproducible commands.

The Day 1 vertical slice is complete when:

1. The backend starts and passes `GET /health`.
2. MongoDB connection configuration is available.
3. A meter can be registered through the backend.
4. The simulator sends telemetry through HTTP.
5. The backend validates and stores that telemetry.
6. The latest-reading API returns the stored record.
7. Invalid telemetry is rejected with a useful error.
8. Requests and simulator failures are logged.
9. The evidence can be reproduced from logs, API responses, and database records.

The current implementation has local contract and failure-path evidence, but criteria 5, 6, and 9 require real MongoDB records before the Day 1 exit condition can be marked complete.
