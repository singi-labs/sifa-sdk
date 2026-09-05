---
"@singi-labs/sifa-sdk": patch
---

Expose `agentRef` on the profile view types (`ProfilePosition`, `ProfileEducation`, `ProfileCertification`, `ProfileVolunteering`, `ProfileHonor`, `ProfileCourse`, `ProfileInvestment`, `ProfileInvolvement`) so consumers can read the canonical nested org reference the AppView emits (#511). Additive optional field, typed as `AgentRef`.
