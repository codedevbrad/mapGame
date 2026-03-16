"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@/domains/user/_contexts/useUser"
import Profile from "@/domains/user/_components/profile"

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
  const router = useRouter()
  const [now, setNow] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { data: user, isLoading: isUserLoading } = useUser()

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
    <header className="w-full flex justify-between items-center p-4">
      <div className="hud-title">WORLDVIEW</div>
      <div className="hud-recording">
        <span className="hud-recording-dot" />
        <span>{isLoading ? "REC SYNCING..." : `REC ${stamp}`}</span>
      </div>
      <div className="flex items-center gap-2">
      
        {isUserLoading ? (
          <span className="text-xs text-cyan-100/70">Loading user...</span>
        ) : user ? (
          <div className="flex items-center gap-2">
           
         <Profile username={user.username} />
          </div>
        ) : (
          <Link
            href="/auth/signin"
            className="rounded border border-cyan-400/45 bg-black/65 px-3 py-1 text-xs uppercase tracking-wide text-cyan-100"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}