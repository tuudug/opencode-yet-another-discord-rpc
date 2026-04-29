export type SessionStatus = "busy" | "idle" | "retry" | "error"

export type PresenceState = {
  displayedSessionID?: string
  sessionCreatedAt?: number
  sessionStatus: SessionStatus
  retryAttempt?: number
  currentAgent?: string
  providerID?: string
  modelID?: string
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cost: number
  lastMessageID?: string
  lastUpdateAt: number
}

export type DiscordActivity = {
  details: string
  state: string | null
  startTimestamp?: number
  largeImageKey: string
  largeImageText: string
  smallImageKey: string
  smallImageText: string
  buttons?: Array<{ label: string; url: string }>
}

export interface PresenceTransport {
  setActivity(activity: DiscordActivity): Promise<void>
  clearActivity(): Promise<void>
  destroy(): Promise<void>
}

export type ReducedEvent = {
  type: string
  properties: Record<string, any>
}