# User Guide: My Profile, Devices & Tractor Mode GPS

This is a plain-English how-to for the account and device features in
FarmMap — written for anyone using the app day to day, not developers.
(If you're looking for the technical write-up, see `docs/DEVICES.md` and
`docs/GEOFENCING.md`.)

---

## My Profile

**Settings → My Profile**

This is where you edit how you show up in FarmMap — separate from your
farm's details (that's under Settings → General).

- **Avatar** — pick one of the emoji options, or leave it blank to show
  your initials instead.
- **Full Name** — shown across the app (sidebar, Tractor Mode Team tab,
  task assignments).
- **Phone** — shown to teammates on the Tractor Mode Team tab, with a
  tap-to-call button. Leave it blank if you'd rather not share it.
- **Email** and **Role** are read-only here. Email is your login and
  can't be changed from this screen. Your role (owner, manager, operator,
  etc.) is set by whoever manages Users & Access.

Click **Save Profile** when you're done. In the free demo, profile edits
don't actually save anywhere — that's expected, not a bug.

---

## Devices (Tractor Mode)

**Settings → Devices**

A "device" here means a tablet or phone that's set up to work in a
tractor, ute, or header — something that should jump straight into
Tractor Mode and doesn't need the full office-style dashboard.

### Registering a device

1. **Sit at the device you want to register** (this only works from the
   device itself, not remotely — it's a one-time setup you do in person).
2. Go to **Settings → Devices → Register This Device**.
3. Give it a name you'll recognise later — e.g. *"8R Cab Tablet"* or
   *"Ute Phone — Sarah"*.
4. Optionally pick who usually uses it.
5. Tap **Register**.

From then on, opening FarmMap on that device launches straight into
Tractor Mode.

### Managing devices

Every registered device shows:
- **Who it's usually assigned to** (editable any time from the dropdown)
- **Last active** — when it last checked in
- **Last location** — which paddock it was last seen in, if GPS has been
  used (see below)
- **Status** — Active or Revoked

Buttons per device:
- **Revoke** — signs that device out the next time it's used. Use this if
  a tablet is lost, stolen, or being decommissioned. *(Honest caveat:
  whoever has the account password could still just log back in on it —
  this stops the device from being trusted going forward, it isn't a
  remote wipe.)*
- **Reactivate** — undoes a revoke.
- **Delete** (trash icon) — removes the device from the list entirely.

If you're standing at a device that's currently registered, you'll see a
banner: *"This device is registered as '...'"* with a **Forget this
device** link — use that if you want this specific browser to stop
auto-launching Tractor Mode.

---

## GPS & Geofencing

This only runs **while Tractor Mode is open**, and only on a registered
device. It doesn't track anything in the background, and it doesn't run
just because a device exists in the list.

### What you'll see

- A status pill in the Tractor Mode header, always telling you what's
  happening:
  | Status | Meaning |
  |---|---|
  | **GPS off** | Tractor Mode isn't open, or GPS hasn't started yet |
  | **Locating…** | Waiting on the first GPS fix |
  | **GPS active** | Reporting your position normally |
  | **Location blocked** | Your browser has denied location access — see Troubleshooting |
  | **GPS unsupported** | This browser/device doesn't support location |

- On the **Map** tab: a pulsing blue "you are here" dot (with a faint
  circle showing GPS accuracy), and a chip saying which paddock you're
  currently in — or *"Outside any mapped paddock"* if you're not inside
  a drawn boundary.

### Geofence alerts

When your position crosses into or out of a paddock boundary, you'll get
a quick on-screen notice ("📍 Entered North Flat" / "📍 Left North Flat").
Every crossing is also logged, so the office can see it later without
watching the screen live:

**Settings → Devices → Recent Geofence Activity** shows who went where and
when, most recent first.

### Things to know

- Geofences are just your paddock boundaries — the same ones drawn on the
  Paddocks page. There's no separate "restricted zone" tool.
- Only paddock crossings are logged, not a continuous trail of everywhere
  you've been — so there's no detailed location history to worry about
  managing or clearing.
- The very first GPS fix after opening Tractor Mode just establishes
  where you are — it won't log a false "entered" event for wherever you
  happened to be standing when you opened it.

---

## Troubleshooting

**"Location blocked" won't go away**
Your browser is remembering a past "block" decision for this site. Look
for a location/lock icon in your browser's address bar, click it, and
allow location access — then reopen Tractor Mode.

**GPS says "Locating…" and never finishes**
Usually a weak signal (indoors, under cover) or a slow first fix outdoors.
Give it 20–30 seconds in the open. If it still doesn't resolve, check your
device's system-level location setting is turned on (not just the
browser's).

**I registered the wrong device / want to start over**
Go to Settings → Devices on that device and use **Forget this device** —
it'll stop auto-launching Tractor Mode. The old entry will still be in
the farm owner's device list until someone deletes it.

**A device isn't showing up on the map / paddock chip says "Outside any
mapped paddock" even though I'm clearly in one**
That paddock doesn't have a drawn boundary yet (only a location pin) —
geofencing needs an actual boundary, drawn from the Paddocks page, not
just a marker.
