---
name: Journal privacy enforcement
description: Verified live Supabase privacy behavior for private journal CRUD and search.
---

The live journal policy grants authenticated users all CRUD operations only when `user_id = auth.uid()` in both the row filter and write check. The journal search RPC also filters by `auth.uid()` on the server and escapes SQL wildcard characters.

**Why:** Search results contain full private journal text. A client-side ownership filter is only defense in depth and must never replace server-side user scoping.

**How to apply:** Preserve the existing RLS and RPC behavior. Keep explicit user predicates in app CRUD calls, use user-scoped query and local-draft keys, and reject any search result whose `user_id` does not match the active session.