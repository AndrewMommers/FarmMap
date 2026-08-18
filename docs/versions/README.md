# FarmMap Version History

A chronological record of the major changes made to FarmMap, one file per phase of work. Each entry covers what was built, why, and the key files involved. Entries are numbered in the order the work happened, oldest first.

This complements — but doesn't replace — `git log`, which has the exact commit-level record. Most of the work below through v13 landed in a small number of large commits (`overhaul`, `landing page ui change`), because it was built as one continuous collaborative session rather than committed feature-by-feature; from v14 onward, each change gets its own commit and push to `main`.

| # | Version | Summary |
|---|---------|---------|
| 01 | [Baseline app](01-baseline-app.md) | Core farm-management app: paddocks, livestock, crops, equipment, finance, inventory, tasks, weather, compliance, reports |
| 02 | [Public marketing website](02-public-website.md) | Landing page at `/` for logged-out visitors |
| 03 | [John Deere integration](03-john-deere-integration.md) | Equipment telematics OAuth scaffold (engine hours, GPS, boundaries) |
| 04 | [Xero & Zepto integration](04-xero-zepto-integration.md) | Accounting sync (Xero) and real-time AU payments (Zepto) |
| 05 | [LAN access fix](05-lan-access-fix.md) | Dev server reachable from other devices on the network |
| 06 | [Responsive / mobile audit](06-responsive-audit.md) | Full app + landing page usable on phones and tablets |
| 07 | [GPS tracking & geofencing](07-gps-geofencing.md) | Live location in Tractor Mode, paddock enter/exit alerts |
| 08 | [Device registration & profile](08-device-registration-profile.md) | Pairing tablets/phones to Tractor Mode, My Profile settings |
| 09 | [Navbar fix](09-navbar-fix.md) | Working profile dropdown in the header |
| 10 | [Landing page content refresh](10-landing-content-refresh.md) | Copy/visuals updated to reflect GPS, geofencing, devices, team |
| 11 | [End-user documentation](11-end-user-docs.md) | Profile & device guide, plus a designed setup artifact |
| 12 | [Landing page design pass 1](12-landing-design-pass-1.md) | Typography, hero mockup, feature tiles, first visual uplift |
| 13 | [Australian sovereign branding](13-aussie-sovereign-branding.md) | Aussie-owned trust signals, sovereign seal, contour motif |
| 14 | [Landing page design pass 2](14-landing-design-pass-2.md) | Second visual pass — chips, irregular paddock shapes, polish |
| 15 | [Landing page animation](15-landing-page-animation.md) | Scroll-reveal and ambient motion, built failure-safe |

## Conventions going forward

- Every change gets committed and pushed to `main` individually, with a description of what changed and why.
- New phases of work get a new numbered file here, added to the table above.
