import { NextResponse } from "next/server"

const DEFAULT_GROUP = "stations"
const CACHE_TTL_MS = 3 * 60 * 1000
const MIN_REFETCH_INTERVAL_MS = 30 * 1000

type SatelliteApiRecord = Record<string, unknown>

let cachedRecords: SatelliteApiRecord[] | null = null
let cachedAtMs = 0
let lastFetchAttemptAtMs = 0
let inFlightFetch: Promise<SatelliteApiRecord[]> | null = null

function buildCelestrakUrl(group: string) {
  const params = new URLSearchParams({
    GROUP: group,
    FORMAT: "json"
  })
  return `https://celestrak.org/NORAD/elements/gp.php?${params.toString()}`
}

async function fetchLiveRecords(group: string) {
  const response = await fetch(buildCelestrakUrl(group), {
    cache: "no-store",
    headers: {
      Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
      "User-Agent": "hackgame-satellite-proxy/1.0"
    }
  })

  if (!response.ok) {
    throw new Error(`Upstream fetch failed (${response.status})`)
  }

  const text = await response.text()
  const parsed = JSON.parse(text) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error("Upstream payload is not an array")
  }

  return parsed.filter((record): record is SatelliteApiRecord => {
    return typeof record === "object" && record !== null
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const group = (url.searchParams.get("group") ?? DEFAULT_GROUP).trim() || DEFAULT_GROUP
  const now = Date.now()

  if (cachedRecords && now - cachedAtMs < CACHE_TTL_MS) {
    return NextResponse.json(cachedRecords, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    })
  }

  if (inFlightFetch) {
    try {
      const records = await inFlightFetch
      return NextResponse.json(records)
    } catch {
      if (cachedRecords) {
        return NextResponse.json(cachedRecords)
      }
      return NextResponse.json({ error: "Satellite feed unavailable" }, { status: 503 })
    }
  }

  if (cachedRecords && now - lastFetchAttemptAtMs < MIN_REFETCH_INTERVAL_MS) {
    return NextResponse.json(cachedRecords)
  }

  lastFetchAttemptAtMs = now
  inFlightFetch = fetchLiveRecords(group)

  try {
    const records = await inFlightFetch
    cachedRecords = records
    cachedAtMs = Date.now()
    return NextResponse.json(records, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    })
  } catch {
    if (cachedRecords) {
      return NextResponse.json(cachedRecords)
    }
    return NextResponse.json({ error: "Satellite feed unavailable" }, { status: 503 })
  } finally {
    inFlightFetch = null
  }
}
