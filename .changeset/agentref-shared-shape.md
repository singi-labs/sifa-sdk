---
"@singi-labs/sifa-sdk": patch
---

Add the shared `agentRef` entity-reference: `agentRefSchema` (with `AgentRef` type) mirroring `id.sifa.defs#agentRef`, and the `resolveAgentRef` dual-read resolver (object-level precedence, nested wins over the legacy flat fields). Primitives for the flat-to-agentRef record migration; no record schema references it yet.
