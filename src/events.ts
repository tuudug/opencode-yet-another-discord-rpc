import type { PresenceState, PresenceTransport, ReducedEvent } from "./types"
import { reduceEvent } from "./state"
import { Debouncer } from "./debounce"
import { formatPresence } from "./format"

type EventPriorityMs = 100 | 200 | 250 | 1000

const EVENT_DELAYS: Record<string, EventPriorityMs> = {
  "session.status": 250,
  "session.error": 100,
  "session.idle": 200,
  "message.updated": 200,
  "message.part.updated": 1000,
}

export function createEventHandler(
  state: PresenceState,
  transport: PresenceTransport,
  debouncer: Debouncer,
): (input: { event: ReducedEvent }) => Promise<void> {
  return async ({ event }) => {
    reduceEvent(state, event)
    const delay = EVENT_DELAYS[event.type] ?? 500
    debouncer.schedule(delay)
  }
}

export function createFlush(
  state: PresenceState,
  transport: PresenceTransport,
  log: (message: string, extra?: Record<string, unknown>) => void,
): () => Promise<void> {
  return async () => {
    const activity = formatPresence(state)
    await transport.setActivity(activity)
    log("presence updated", { activity })
  }
}