# Sorting Your MCP Tools

The Sorting Hat MCP integration brings magical governance to every tool call in Archestra. Before any tool is invoked, the Sorting Hat classifies it into one of the four Hogwarts houses based on its risk profile and intent — then authorizes it accordingly.

## How It Works

```
Tool invocation
     ↓
sorting_hat.sort(tool_name, description)
     ↓ streams Hat monologue via SSE
House assigned → GRYFFINDOR | SLYTHERIN | RAVENCLAW | HUFFLEPUFF
     ↓
patronus.cast(user_id, "expecto_patronum")
     ↓
Corporeal? ──Yes──→ Authorized (all houses)
           ──No───→ BLOCKED for Slytherin tools
     ↓
floo.travel(from_server, to_server, payload)
     ↓
Tool executes, quidditch.stream emits Snitch frames at 60fps
```

## The Four Houses

| House | Risk Level | Example Tools |
|-------|-----------|---------------|
| **Hufflepuff** 🦡 | Safe reads | `get_*`, `list_*`, `status`, `health` |
| **Ravenclaw** 🦅 | Analysis | `search_*`, `analyze_*`, `query_*` |
| **Gryffindor** 🦁 | Brave writes | `create_*`, `deploy_*`, `send_*` |
| **Slytherin** 🐍 | High risk | `delete_*`, `execute_*`, `admin_*` |

## The Sorting Hat Prompt

The Sorting Hat uses the following rhyming logic to classify tools:

```
Hmm, let me think — what does this tool do?
  If it deletes or destroys, then Slytherin's true.
  If it creates with courage, brave Gryffindor's due.
  If it searches and analyses, Ravenclaw's for you.
  If it safely reads only, Hufflepuff sees it through.
```

This prompt is also the basis for the streaming monologue delivered token-by-token via SSE during the Sorting Hat modal animation.

## Patronus Authorization

Every user has a unique Patronus form, deterministically derived from their `user_id` using SHA-256. This means the same user always gets the same Patronus — it's stable across sessions and testable via snapshot tests.

**Corporeal Patronuses** (the majority of users) can authorize any house.

**Non-corporeal Patronuses** produce a silvery mist that cannot fully materialize — these are blocked from authorizing **Slytherin-sorted** tools. The user sees:

> 🌫️ *Expecto Patronum... a silvery mist takes the shape of a [form], but cannot fully materialize.*

## The Floo Network

Once a tool is authorized, `floo.travel` routes the payload from the Sorting Hat MCP server back to the underlying target MCP server. The streaming UI shows green flame particles (`#00ff41`) during transit.

## The Golden Snitch Loader

For any **Gryffindor-sorted** tool, the default loading spinner is replaced with a Golden Snitch animation. Use `quidditch.stream(tool_call_id)` to receive 60fps frame data for the canvas animation.

The Snitch follows a Lissajous curve trajectory:
```
x = 50 + 40·cos(t)
y = 50 + 20·sin(2t)
```

## API Reference

### `archestra__sorting_hat__sort`

```typescript
{
  tool_name: string;           // Full name of the tool to sort
  tool_description?: string;   // Optional description for better classification
  please_not_slytherin?: boolean; // Whisper a preference (may be overridden)
}
```

Returns `{ house, confidence, monologue, reasoning, authorized }`.

### `archestra__patronus__cast`

```typescript
{
  user_id: string;                 // User ID
  charm: "expecto_patronum";       // Must be this value
}
```

Returns `{ form, corporeal, incantation }`.

### `archestra__floo__travel`

```typescript
{
  from_server: string;             // Source MCP server
  to_server: string;               // Destination MCP server
  payload: Record<string, unknown>; // Tool call payload
}
```

Returns `{ routed, particles, color, from_server, to_server, payload_size }`.

### `archestra__quidditch__stream`

```typescript
{
  tool_call_id: string;   // Tool call to track
  frame_count?: number;   // Default: 60 (1 second at 60fps)
}
```

Returns `{ tool_call_id, frames, fps, complete }` where `frames` contains per-frame Snitch position data.

## Non-Goals

- **Ministry of Magic SSO** — tracked separately
- **Time-Turner request replay** — needs RFC for idempotency
- **House Cup leaderboard** — nice to have, not blocking

## Forbidden Forest Theme

Enable the Forbidden Forest dark-mode variant from **Settings → Appearance → Theme → Forbidden Forest**. This applies a deep forest green/black color scheme with bioluminescent accent colors (`#00ff41`) matching the Floo Network flame.
