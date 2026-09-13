---
name: Supabase profile lifecycle
description: Non-obvious contract between Supabase Auth sign-up metadata and the existing profile row.
---

New auth users receive a profile automatically through a database trigger. Sign-up metadata must include `display_name`; the app should not insert profile rows itself. The profile UUID is the auth user UUID.

**Why:** The existing trigger reads `raw_user_meta_data.display_name` and otherwise stores `Friend`. Profile RLS permits users to read and update their own row but does not permit client inserts.

**How to apply:** Send `display_name` during sign-up, then use authenticated updates for onboarding and settings. Never add a client-side profile insert fallback or alter the live schema.