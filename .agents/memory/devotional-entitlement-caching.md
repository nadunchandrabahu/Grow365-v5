---
name: Devotional entitlement caching
description: Security rules for caching Supabase-gated devotional metadata and Adobe Express URLs.
---

Devotional metadata caches must be scoped to the authenticated user. Only rows marked universally free may be recovered from device storage when a fresh Supabase entitlement check cannot run. Protected cached query data must not render while a new RLS fetch is still validating access.

**Why:** Devotional rows include public Adobe Express URLs. A cache keyed only by devotional ID can expose subscriber content after entitlement expires or to another account on the same device, bypassing the live database policy.

**How to apply:** Include the active user ID in query and device-cache keys, promptly garbage-collect detail queries, refuse offline fallback for non-free rows, and wait for a fresh fetch before rendering stale protected data.