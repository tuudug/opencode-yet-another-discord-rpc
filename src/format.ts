import type { PresenceState, DiscordActivity } from "./types"

const MODEL_SHORTENINGS: Record<string, string> = {
  "claude-sonnet-4-5-20250929": "claude-4.5",
  "claude-sonnet-4.5": "claude-4.5",
  "claude-3-5-sonnet-20241022": "claude-3.5",
  "claude-3-5-sonnet": "claude-3.5",
  "claude-opus-4-20250514": "claude-opus-4",
  "claude-haiku-3-5-20241022": "claude-haiku-3.5",
  "gpt-4o-2024-08-06": "gpt-4o",
  "gpt-4o-mini": "gpt-4o-mini",
  "o1-preview": "o1",
  "o1-mini": "o1-mini",
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gemini-2.0-flash": "gemini-2-flash",
}

export function shortenModel(modelID: string): string {
  if (MODEL_SHORTENINGS[modelID]) return MODEL_SHORTENINGS[modelID]

  for (const [pattern, replacement] of Object.entries(MODEL_SHORTENINGS)) {
    if (modelID.startsWith(pattern)) return replacement
  }

  if (modelID.length > 20) return modelID.slice(0, 18) + "..."
  return modelID
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

export function compactNumber(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (n >= 1_000) {
    const k = n / 1_000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return String(n)
}

export function clamp(s: string, min: number, max: number): string {
  const out = s.length > max ? s.slice(0, max) : s
  return out.length >= min ? out : out.padEnd(min, " ")
}

export function formatPresence(state: PresenceState): DiscordActivity {
  const shortModel = state.modelID ? shortenModel(state.modelID) : null

  let details: string
  if (state.sessionStatus === "error") {
    details = "Error"
  } else if (state.sessionStatus === "retry") {
    details = state.retryAttempt ? `Retrying #${state.retryAttempt}` : "Retrying"
  } else if (!state.currentAgent && !shortModel) {
    details = "OpenCode"
  } else {
    const parts: string[] = []
    if (state.currentAgent) parts.push(capitalize(state.currentAgent))
    if (shortModel) parts.push(shortModel)
    details = parts.join(" • ")
  }

  let stateLine: string | null = null
  if (state.inputTokens > 0 || state.outputTokens > 0 || state.cost > 0) {
    const usageParts: string[] = []
    if (state.inputTokens > 0 || state.outputTokens > 0) {
      usageParts.push(`↑${compactNumber(state.inputTokens)} ↓${compactNumber(state.outputTokens)}`)
    }
    if (state.cost > 0) {
      usageParts.push(`$${state.cost.toFixed(4)}`)
    }
    stateLine = usageParts.join(" • ")
  }

  const fullModel = state.providerID && state.modelID
    ? `${state.providerID}/${state.modelID}`
    : null

  const statusImageMap: Record<string, string> = {
    busy: "busy",
    idle: "idle",
    retry: "retry",
    error: "error",
  }

  const statusTextMap: Record<string, string> = {
    busy: "Busy",
    idle: "Idle",
    retry: "Retrying",
    error: "Error",
  }

  return {
    details: clamp(details, 2, 128),
    state: stateLine ? clamp(stateLine, 2, 128) : null,
    startTimestamp: state.sessionCreatedAt
      ? Math.floor(state.sessionCreatedAt / 1000)
      : undefined,
    largeImageKey: "opencode",
    largeImageText: fullModel ? clamp(`Current model: ${fullModel}`, 2, 128) : "OpenCode",
    smallImageKey: statusImageMap[state.sessionStatus] ?? "idle",
    smallImageText: statusTextMap[state.sessionStatus] ?? "Idle",
    buttons: [
      { label: "GitHub", url: "https://github.com/opencode-ai/opencode" },
    ],
  }
}