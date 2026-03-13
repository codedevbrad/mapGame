"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type TimeResponse = {
  isoTime: string
}

function formatUtcStamp(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}Z`
}

export default function Header() {
  const [now, setNow] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncTime = useCallback(async () => {
    try {
      const response = await fetch("/api/time", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to fetch time")
      }
      const data = (await response.json()) as TimeResponse
      setNow(new Date(data.isoTime))
    } catch {
      setNow(new Date())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncTime()
    const syncInterval = window.setInterval(() => {
      void syncTime()
    }, 30_000)

    return () => window.clearInterval(syncInterval)
  }, [syncTime])

  useEffect(() => {
    if (!now) return

    const tickInterval = window.setInterval(() => {
      setNow((prev) => (prev ? new Date(prev.getTime() + 1000) : prev))
    }, 1000)

    return () => window.clearInterval(tickInterval)
  }, [now])

  const stamp = useMemo(() => {
    if (!now) return "SYNCING..."
    return formatUtcStamp(now)
  }, [now])

  return (
    <header className=" w-full flex justify-between items-center p-4">
      <div className="hud-title">WORLDVIEW</div>
      <div className="hud-recording">
        <span className="hud-recording-dot" />
        <span>{isLoading ? "REC SYNCING..." : `REC ${stamp}`}</span>
      </div>
    </header>
  )
}