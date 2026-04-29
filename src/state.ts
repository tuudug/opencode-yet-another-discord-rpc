import type { PresenceState, SessionStatus, ReducedEvent } from "./types"

export function createEmptyState(): PresenceState {
  return {
    sessionStatus: "idle",
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    cost: 0,
    lastUpdateAt: Date.now(),
  }
}

export function pickDisplayedSession(
  current: PresenceState,
  incomingSessionID: string,
  status?: SessionStatus,
): string {
  if (!current.displayedSessionID) return incomingSessionID
  if (current.displayedSessionID === incomingSessionID) return incomingSessionID
  if (current.sessionStatus === "busy") return current.displayedSessionID
  if (status === "busy" || status === "retry") return incomingSessionID
  return current.displayedSessionID
}

function toSessionStatus(type: string, attempt?: number): { status: SessionStatus; retryAttempt?: number } {
  if (type === "busy") return { status: "busy" }
  if (type === "retry") return { status: "retry", retryAttempt: attempt }
  return { status: "idle" }
}

export function reduceEvent(state: PresenceState, event: ReducedEvent): void {
  switch (event.type) {
    case "session.created": {
      const info = event.properties.info
      if (!info) return
      state.displayedSessionID = pickDisplayedSession(state, info.id)
      state.sessionCreatedAt = info.time?.created ?? Date.now()
      state.lastUpdateAt = Date.now()
      return
    }

    case "session.status": {
      const { sessionID, status } = event.properties
      if (!sessionID || !status) return
      const { status: newStatus, retryAttempt } = toSessionStatus(status.type, status.attempt)
      state.displayedSessionID = pickDisplayedSession(state, sessionID, newStatus)
      state.sessionStatus = newStatus
      state.retryAttempt = retryAttempt
      state.lastUpdateAt = Date.now()
      return
    }

    case "session.error": {
      state.sessionStatus = "error"
      state.lastUpdateAt = Date.now()
      return
    }

    case "message.part.updated": {
      const part = event.properties.part
      if (!part) return
      if (state.displayedSessionID && part.sessionID !== state.displayedSessionID) return

      if (part.type === "agent") {
        state.currentAgent = part.name
      }

      if (part.type === "subtask") {
        state.currentAgent = part.agent
      }

      if (part.type === "step-finish") {
        state.inputTokens += part.tokens?.input ?? 0
        state.outputTokens += part.tokens?.output ?? 0
        state.reasoningTokens += part.tokens?.reasoning ?? 0
        if (part.cost != null) state.cost += part.cost
      }

      if (part.messageID) state.lastMessageID = part.messageID
      state.lastUpdateAt = Date.now()
      return
    }

    case "message.updated": {
      const msg = event.properties.info
      if (!msg) return
      if (msg.role !== "assistant") return
      if (state.displayedSessionID && msg.sessionID !== state.displayedSessionID) return

      if (msg.providerID) state.providerID = msg.providerID
      if (msg.modelID) state.modelID = msg.modelID
      if (msg.tokens) {
        state.inputTokens = msg.tokens.input ?? state.inputTokens
        state.outputTokens = msg.tokens.output ?? state.outputTokens
        state.reasoningTokens = msg.tokens.reasoning ?? state.reasoningTokens
      }
      if (msg.cost != null) state.cost = msg.cost
      if (msg.id) state.lastMessageID = msg.id
      state.lastUpdateAt = Date.now()
      return
    }

    case "session.idle": {
      state.sessionStatus = "idle"
      state.retryAttempt = undefined
      state.lastUpdateAt = Date.now()
      return
    }
  }
}