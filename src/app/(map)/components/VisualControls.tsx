"use client"

export type ShaderMode = "none" | "flir" | "nvg" | "glitch"

type VisualControlsProps = {
  shaderMode: ShaderMode
  onShaderChange: (mode: ShaderMode) => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export default function VisualControls({
  shaderMode,
  onShaderChange,
  onZoomIn,
  onZoomOut
}: VisualControlsProps) {
  return (
    <div className="flex items-end gap-3">
      <div>
        <label className="mb-1 block text-xs tracking-widest text-cyan-300">
          VISUAL SHADER
        </label>
        <select
          value={shaderMode}
          onChange={(event) => onShaderChange(event.target.value as ShaderMode)}
          className="min-w-36 rounded border border-cyan-300/40 bg-black/80 px-2 py-1 text-sm text-cyan-100 outline-none"
        >
          <option value="none">None</option>
          <option value="flir">FLIR</option>
          <option value="nvg">NVG</option>
          <option value="glitch">Glitch</option>
        </select>
      </div>

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={onZoomOut}
          className="h-9 w-9 rounded border border-cyan-300/40 bg-black/80 text-lg leading-none text-cyan-100 transition hover:border-cyan-300/70"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className="h-9 w-9 rounded border border-cyan-300/40 bg-black/80 text-lg leading-none text-cyan-100 transition hover:border-cyan-300/70"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  )
}
