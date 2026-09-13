---
name: Account deletion lifecycle
description: Server and client responsibilities for ownership transfer and complete account erasure.
---

Account deletion must use the authenticated server RPC and must fail while the user still owns any group. Ownership transfer is an atomic server RPC to an existing member. Discussion records retain their text with a null author and render as “Former member.”

**Why:** Group ownership cannot safely change through separate client writes, and deleting an owner would strand the group. Discussion continuity is intentional, while journals, bookmarks, progress, subscriptions, memberships, avatars, and local drafts are private user data that must be removed.

**How to apply:** Transfer every owned group first; purge every object under the user’s avatar folder while authorization still exists; call the deletion RPC; then remove user-scoped drafts/caches/reminders, clear query state, and sign out locally.