import { z } from 'zod'
import { env } from '../config/env.js'

const aiResponseSchema = z.object({
  meterId: z.string(),
  modelVersion: z.string(),
  anomalyType: z.enum([
    'NORMAL',
    'LOAD_THEFT',
    'METER_TAMPERING',
    'REVERSE_ENERGY',
    'COMMUNICATION_FAILURE',
  ]),
  status: z.enum(['normal', 'anomaly', 'communication_failure']),
  riskScore: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()),
})

export async function classifyTelemetry(telemetry) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), env.AI_SERVICE_TIMEOUT_MS)

  try {
    const response = await fetch(`${env.AI_SERVICE_URL.replace(/\/$/, '')}/predict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        meterId: telemetry.meterId,
        timestamp: telemetry.timestamp,
        voltage: telemetry.voltage,
        current: telemetry.current,
        powerKw: telemetry.powerKw,
        powerFactor: telemetry.powerFactor,
        importKwh: telemetry.importKwh,
        exportKwh: telemetry.exportKwh,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const parsed = aiResponseSchema.safeParse(await response.json())
    return parsed.success ? parsed.data : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}