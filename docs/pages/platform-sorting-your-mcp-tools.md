---
title: Sorting your MCP tools
category: MCP
order: 5
description: Patronus-based authorization for risky MCP tool calls
lastUpdated: 2026-05-26
---

<!--
Check ../docs_writer_prompt.md before changing this file.
-->

Sorting Hat MCP is a deterministic authorization layer for MCP tool calls. It sorts each tool by risk before Archestra forwards the call to the backing MCP server.

## How Sorting Works

`sorting_hat.sort` looks at the tool name, description, and request headers. It returns:

```json
{
  "house": "slytherin",
  "confidence": 0.93
}
```

The four houses map to operational intent:

| House      | Typical tools                                      |
| ---------- | -------------------------------------------------- |
| Hufflepuff | Low-risk reads, docs lookup, status checks         |
| Ravenclaw  | Inspection, search, query, analysis                |
| Gryffindor | Urgent operational work such as deploys or hotfixes |
| Slytherin  | Destructive, privileged, credential, or data writes |

If the request includes `please_not_slytherin`, the Hat records the preference and avoids Slytherin for non-destructive tools. Destructive tools can still be sorted into Slytherin.

## Patronus Authorization

`patronus.cast` derives a stable Patronus from the Archestra user id:

```json
{
  "form": "stag",
  "corporeal": true
}
```

Slytherin-sorted tools require a corporeal Patronus before the payload can be forwarded. Other houses can proceed without that extra requirement.

## Forwarding

`floo.travel` forwards an authorized payload back to the target MCP server. It preserves the original payload and emits green flame particle metadata for the streaming UI.

`quidditch.stream` emits Golden Snitch progress frames at a 60fps cadence so the frontend can render a tool-specific loading state while the call is in flight.

## Sorting Hat Prompt

Use this prompt text when a client wants a visible Hat monologue:

```text
I sort the tool before it flies,
I weigh the risk behind its guise.
For gentle reads, a patient path;
For dangerous writes, my guarded wrath.
Name the house, explain the call,
Then let the Patronus guard it all.
```

Keep the final allow or block decision deterministic. The monologue is only presentation; it must not override the house assignment or Patronus check.
