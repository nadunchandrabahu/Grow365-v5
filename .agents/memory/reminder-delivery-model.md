---
name: Reminder delivery model
description: Canonical reminder routing and the accepted cross-timezone limitation of local notifications.
---

Daily reminder taps must open a stable “today” resolver, which selects the published devotional for the current calendar date in the profile timezone at tap time. Do not schedule future devotional IDs into repeating notification payloads.

**Why:** A repeating local notification has static content and cannot know which devotional record will be published on a future day. Resolving at tap time also keeps notification behavior aligned with Home.

**How to apply:** Keep Home and notification routing on the same profile-timezone calendar-date rule. iOS can use a timezone-aware calendar trigger. Android local recurring notifications must be recalculated when the app foregrounds or settings change, and must not promise exact selected-timezone delivery across DST or device-timezone changes while the app remains closed; exact delivery requires server push or native timezone-aware scheduling.