# 06 — Responsive / mobile audit

**Request:** "Lets make sure that the web and the portal is support for all devices."

A full pass over the app and landing page, verified with real browser screenshots at phone/tablet/desktop widths rather than just eyeballing the CSS.

## Bugs found and fixed

- **Sidebar** stayed visible in its collapsed icon-rail state on mobile instead of hiding — fixed with an off-canvas `-translate-x-full` pattern.
- **`appStore.sidebarOpen`** defaulted to `true`, causing an intrusive full-screen drawer on first mobile visit — fixed to compute from `window.innerWidth >= 1024` instead of a static default.
- **StatCard grids** jumped straight from 1 to 2 columns on phones, overflowing dollar-value text — fixed by using the previously unused `xs: 480px` Tailwind breakpoint (`grid-cols-2 lg:grid-cols-4` → `grid-cols-1 xs:grid-cols-2 lg:grid-cols-4`) across 10 files.
- **Settings integration/device cards** squeezed titles into unreadable slivers on mobile — fixed with a `flex-col sm:flex-row` stacking pattern, applied to Integrations cards, Devices cards, and Users & Access rows.

## Key files

- `src/components/layout/Sidebar.tsx`
- `src/store/appStore.ts`
- Various `StatCard` usages across page components
- `src/pages/SettingsPage.tsx`
