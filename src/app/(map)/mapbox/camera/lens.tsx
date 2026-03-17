export function MapLensOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 80 80"
        className="h-47 w-47 drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
      >
        <circle
          cx="40"
          cy="40"
          r="40"
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.1"
        />
        <circle
          cx="40"
          cy="40"
          r="9"
          fill="none"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="0.7"
        />
        <circle
          cx="40"
          cy="40"
          r="2"
          fill="rgba(255, 255, 255, 0.95)"
        />
      </svg>
    </div>
  )
}
