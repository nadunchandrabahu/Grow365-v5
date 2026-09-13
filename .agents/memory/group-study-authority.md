---
name: Group study authority
description: Security boundary for group joining, content visibility, and moderation.
---

Group creation and joining must use the database RPCs. The app must never read or write the stored group password hash. Group content and moderation writes should be attempted normally and let RLS authorize or reject them; surface database denials instead of recreating authorization policy in the client.

**Why:** The join RPC hashes and verifies passwords server-side, records attempts, and rate-limits repeated failures. RLS already encodes private-note visibility, membership access, author editing, and owner/admin moderation.

**How to apply:** Send join credentials only as RPC arguments, map structured join errors to honest UI, select explicit safe group columns, and do not add client role checks that can drift from database policy.

Group covers use the private `group-covers` bucket. Object paths start with the group UUID; live Storage policies allow group-member reads and owner/admin writes through the existing membership helpers.

**Why:** Private signed URLs prevent group artwork from becoming public while preserving the same database-defined membership boundary as group content.

**How to apply:** Store only the object path in `groups.cover_path`, generate user-scoped short-lived signed URLs, verify the path update returned a row, and clean up orphaned uploads after partial failures.