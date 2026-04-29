import type { Plugin, PluginModule, PluginOptions } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"
import type { ReducedEvent } from "./types"
import { createEmptyState } from "./state"
import { createEventHandler, createFlush } from "./events"
import { DiscordRPCTransport } from "./transport"
import { Debouncer } from "./debounce"

const DEFAULT_CLIENT_ID = "1499005050129748009"

const discordPresencePlugin: Plugin = async ({ client }, options?: PluginOptions) => {
  const clientId = (options?.clientId as string | undefined) ?? process.env.DISCORD_CLIENT_ID ?? DEFAULT_CLIENT_ID

  const state = createEmptyState()

  async function log(message: string, extra?: Record<string, unknown>) {
    try {
      await client.app.log({
        body: {
          service: "discord-rich-presence",
          level: "debug",
          message,
          extra: extra ?? {},
        },
      })
    } catch {
      // logging is best-effort; never block the plugin
    }
  }

  const transport = new DiscordRPCTransport(clientId, log)
  const flush = createFlush(state, transport, log)
  const debouncer = new Debouncer(flush, 1000)

  await transport.connect()
  await log("Discord Rich Presence plugin loaded")

  return {
    event: async ({ event }: { event: Event }) => {
      const reduced: ReducedEvent = {
        type: event.type,
        properties: event.properties as Record<string, any>,
      }
      const handler = createEventHandler(state, transport, debouncer)
      await handler({ event: reduced })
    },
  }
}

export default {
  server: discordPresencePlugin,
} satisfies PluginModule

export { createEmptyState, reduceEvent, pickDisplayedSession } from "./state"
export { formatPresence, shortenModel, capitalize, compactNumber, clamp } from "./format"
export { DiscordRPCTransport } from "./transport"
export { Debouncer } from "./debounce"
export { createEventHandler, createFlush } from "./events"
export type { PresenceState, DiscordActivity, PresenceTransport, SessionStatus, ReducedEvent } from "./types"