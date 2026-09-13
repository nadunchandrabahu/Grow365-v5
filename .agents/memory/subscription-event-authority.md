---
name: Subscription event authority
description: Trust and lifecycle rules for future Apple and Google subscription processing.
---

The database entitlement function is the only authority for paid access. The client may display its own subscription row but must never create, update, restore, or infer entitlement locally. Record each store message in the raw subscription event log before applying it.

**Why:** Store callbacks can be duplicated, delayed, or delivered out of order. Cancellation disables renewal but does not end already-paid access; access continues until the recorded period end.

**How to apply:** Tie the store customer to the authenticated profile, make event processing idempotent, update the one-row-per-user subscription projection only after persisting the raw event, and let the entitlement function evaluate status and period end.