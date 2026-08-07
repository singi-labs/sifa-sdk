---
'@singi-labs/sifa-sdk': patch
---

Add the investment layer for `id.sifa.profile.investment`: the `ProfileInvestment` type, `ProfileInvestmentRecordSchema` and `InvestmentWriteSchema`, the role/stage/status taxonomy with labels, and create/update/delete fetchers plus their TanStack hooks. Capital positions only — board seats and advisory roles remain positions.
