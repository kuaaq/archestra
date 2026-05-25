# Sorting Hat MCP

`@archestra/sorting-hat-mcp` contains the first reviewable slice for the Sorting Hat tool-governance flow.

It provides four MCP-facing tools:

- `sorting_hat.sort` classifies a tool by intent and risk into a house.
- `patronus.cast` derives a stable Patronus from the Archestra user id.
- `floo.travel` routes authorized payloads to the backing MCP server.
- `quidditch.stream` produces Golden Snitch progress frames for tool-call loading UIs.

The package is intentionally deterministic. The house assignment and Patronus output are pure functions, so the gateway can test, audit, and replay authorization decisions without calling an LLM.

## Local Checks

```bash
corepack pnpm --filter @archestra/sorting-hat-mcp test
corepack pnpm --filter @archestra/sorting-hat-mcp type-check
```

## Example

```ts
import { authorizeToolCall } from "@archestra/sorting-hat-mcp";

const decision = authorizeToolCall({
  userId: "user_123",
  toolName: "delete_database",
  toolDescription: "Permanently delete production database rows",
});

if (!decision.allowed) {
  throw new Error(decision.reason);
}
```
