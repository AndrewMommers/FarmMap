# 05 — LAN access fix

**Request:** "I can't access it with my pc ip:5173."

## What changed

- `vite.config.ts` had no `server.host` set, so the dev server only bound to `localhost` and wasn't reachable from other devices on the network.
- Added `server: { host: true }` so it binds to all interfaces.

## Notes

- Diagnosed (informational, not fixed in-app) that a NordVPN network adapter produces a second, non-LAN-reachable "Network" URL, and that Windows Firewall's Public-profile categorization likely blocks inbound connections on both interfaces — a firewall rule was offered but not pursued at the time.

## Key files

- `vite.config.ts`
