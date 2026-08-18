# 09 — Navbar fix

**Request:** "Lets fix the top navbar as it's not properly showing the profile and it doesn't do anything."

## What changed

- The header's avatar `<div>` had `cursor-pointer` styling but no `onClick` — it looked interactive but did nothing.
- Replaced it with a real `ProfileDropdown` component, mirroring the existing `NotificationDropdown` pattern (ref + click-outside via a `mousedown` listener).
- Shows the actual signed-in user's name, email, role and avatar. Menu items: "My Profile" (`/settings?tab=profile`), "Settings" (`/settings`), and "Sign Out" / "Exit Demo" (the old standalone `LogOut` button was folded into this menu).
- `SettingsPage.tsx` gained a `?tab=` query-param read on mount to support the deep link from the dropdown.

## Key files

- `src/components/layout/Header.tsx`
- `src/pages/SettingsPage.tsx`
