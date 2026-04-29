# OpenCode Yet Another Discord RPC

Discord Rich Presence plugin for [OpenCode](https://github.com/opencode-ai/opencode). Shows your current agent, model, token usage, and cost directly on your Discord profile.

Built with the **GLM-5.1** model in **OpenCode**.

## What it looks like

```
🎮 OpenCode
Build • claude-4.5
18.2k in / 4.1k out • $0.0842

⏱ 4:32 elapsed
[GitHub ⤴]
```

The presence updates in real time as you work — switching agents, models, and tracking tokens/cost as they accumulate.

## Status states

| State | Details line | Small badge |
|---|---|---|
| Busy | `Build • claude-4.5` | `⚡ busy` |
| Idle | `Idle • claude-4.5` | `💤 idle` |
| Retrying | `Retrying #2 • claude-4.5` | `🔄 retry` |
| Error | `Error` | `❌ error` |
| No session | `OpenCode` | `💤 idle` |

## Installation

```bash
# Using bun
bun add opencode-yet-another-discord-rpc

# Using npm
npm install opencode-yet-another-discord-rpc

# Using pnpm
pnpm add opencode-yet-another-discord-rpc
```

## Quick Start

Add the plugin to your `opencode.json` config:

```json
{
  "plugins": ["opencode-yet-another-discord-rpc"]
}
```

That's it! The plugin will automatically connect to Discord and display your session status.

Make sure the Discord desktop client is running — the plugin connects via local IPC.

## Configuration

The plugin works out of the box with a default Discord application ID. To use your own:

**Option A — Config file (recommended):**

```json
{
  "plugins": [
    ["opencode-yet-another-discord-rpc", { "clientId": "YOUR_APP_ID" }]
  ]
}
```

**Option B — Environment variable:**

```bash
export DISCORD_CLIENT_ID="YOUR_APP_ID"
```

Priority: config option → env var → default application ID.

### Custom art assets

If you use your own Discord application, upload these images to the [Discord Developer Portal](https://discord.com/developers/applications) → your application → **Rich Presence** → **Art Assets**:

| Key | Description | Recommended size |
|---|---|---|
| `opencode` | Main logo | 1024×1024px |
| `busy` | Working status badge | 512×512px |
| `idle` | Idle status badge | 512×512px |
| `retry` | Retrying status badge | 512×512px |
| `error` | Error status badge | 512×512px |

## Architecture

```
OpenCode runtime
  └─ Plugin event hook
       └─ Presence state reducer
            └─ Debounce layer (100ms–1s)
                 └─ Discord RPC transport (local IPC)
                      └─ Discord desktop client
```

- **Event-driven** — subscribes to OpenCode's `event` hook for live updates
- **Debounced** — coalesces rapid `step-finish` events (1s), status changes faster (250ms)
- **Reconnecting** — auto-reconnects to Discord with exponential backoff
- **Privacy-safe** — never exposes repo paths, file names, prompt text, or API keys

## Privacy

This plugin only shows:

- Agent name (Build, Explore, Plan, etc.)
- Model identifier (shortened provider/modelID)
- Aggregate token counts and cost
- Session state (busy/idle/retry/error)

It **never** shows: repository names, file paths, Git branches, prompt text, tool arguments, or any code content.

## Development

```bash
bun install
bun run typecheck
```

## Project structure

```
src/
  index.ts        # Plugin entry point (PluginModule export)
  types.ts        # Type definitions
  state.ts        # Event reducer / state machine
  format.ts       # Presence formatting + model shortening
  debounce.ts     # Debounce/coalesce timer
  transport.ts    # Discord RPC transport (reconnect w/ backoff)
  events.ts       # Event handler + flush factory
```

## License

MIT