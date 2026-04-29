import { Client } from "@xhayper/discord-rpc"
import type { DiscordActivity, PresenceTransport } from "./types"

const RECONNECT_BASE_MS = 5_000
const RECONNECT_MAX_MS = 60_000
const RECONNECT_JITTER_MS = 1_000

export class DiscordRPCTransport implements PresenceTransport {
  private client: Client
  private connected = false
  private connecting = false
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private pendingActivity: DiscordActivity | null = null
  private log: (message: string, extra?: Record<string, unknown>) => void

  constructor(
    clientId: string,
    log: (message: string, extra?: Record<string, unknown>) => void,
  ) {
    this.client = new Client({ clientId })
    this.log = log

    this.client.on("ready", () => {
      this.connected = true
      this.connecting = false
      this.reconnectAttempts = 0
      this.log("Discord RPC connected", { user: this.client.user?.username })
      if (this.pendingActivity) {
        this.setActivity(this.pendingActivity)
        this.pendingActivity = null
      }
    })

    this.client.on("disconnected", () => {
      this.connected = false
      this.log("Discord RPC disconnected")
      this.scheduleReconnect()
    })

    this.client.on("error", (err) => {
      this.log("Discord RPC error", { error: String(err) })
    })
  }

  async connect(): Promise<void> {
    if (this.connecting || this.connected) return
    this.connecting = true
    try {
      await this.client.login()
      this.log("Discord RPC login initiated")
    } catch (err) {
      this.connecting = false
      this.log("Discord RPC login failed", { error: String(err) })
      this.scheduleReconnect()
    }
  }

  async setActivity(activity: DiscordActivity): Promise<void> {
    if (!this.connected) {
      this.pendingActivity = activity
      return
    }

    try {
      await this.client.user?.setActivity({
        details: activity.details,
        state: activity.state ?? undefined,
        startTimestamp: activity.startTimestamp,
        largeImageKey: activity.largeImageKey,
        largeImageText: activity.largeImageText,
        smallImageKey: activity.smallImageKey,
        smallImageText: activity.smallImageText,
        buttons: activity.buttons,
      })
    } catch (err) {
      this.log("Discord RPC setActivity failed", { error: String(err) })
    }
  }

  async clearActivity(): Promise<void> {
    this.pendingActivity = null
    if (!this.connected) return
    try {
      await this.client.user?.clearActivity()
    } catch (err) {
      this.log("Discord RPC clearActivity failed", { error: String(err) })
    }
  }

  async destroy(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    try {
      await this.client.destroy()
    } catch {
      // best effort
    }
    this.connected = false
    this.connecting = false
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_MS,
    )
    const jitter = Math.floor(Math.random() * RECONNECT_JITTER_MS)
    this.reconnectAttempts++
    this.log(`Discord RPC reconnecting in ${delay + jitter}ms (attempt ${this.reconnectAttempts})`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      this.connect()
    }, delay + jitter)
  }
}