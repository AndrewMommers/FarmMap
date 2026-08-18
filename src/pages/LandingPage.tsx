import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useDataStore } from '../store/dataStore';
import {
  Wheat, Map, Beef, Sprout, Wrench, DollarSign, Package, CloudRain,
  CheckSquare, FileBarChart, ShieldCheck, Tractor, PlayCircle, ArrowRight,
  Menu, X, Check, Landmark, Zap, RefreshCw, MapPin, Users, Compass, BadgeCheck,
  MessageCircle, BellRing,
} from 'lucide-react';

const INTEGRATIONS = [
  {
    icon: Tractor,
    name: 'John Deere Operations Center',
    desc: 'Machine engine hours, GPS location and field boundaries sync straight into your Equipment and Paddocks — no manual logging.',
  },
  {
    icon: Landmark,
    name: 'Xero',
    desc: 'Bank transactions flow into your Finance ledger automatically, categorised and ready for reporting — no re-keying every line.',
  },
  {
    icon: Zap,
    name: 'Zepto',
    desc: 'Real-time bank payments (PayTo) land in your ledger the moment they clear, with GST and paddock tagging still done your way.',
  },
];

const FEATURES = [
  { icon: Map, title: 'Paddock Mapping', tone: 'farm', desc: 'Draw paddock boundaries straight onto a live map. Track soil type, status and what’s growing where, at a glance.' },
  { icon: Beef, title: 'Livestock Records', tone: 'farm', desc: 'NLIS tags, breeds, weights and health status for every animal and mob — searchable, sortable, exportable.' },
  { icon: Sprout, title: 'Crops & Spray Records', tone: 'farm', desc: 'Plan plantings by season, track yield per hectare, and keep a compliant chemical register with withholding periods.' },
  { icon: Wrench, title: 'Equipment & Maintenance', tone: 'farm', desc: 'Service schedules, maintenance logs and running costs for every tractor, harvester and pump on the property.' },
  { icon: DollarSign, title: 'Finance & GST', tone: 'earth', desc: 'Income and expenses in AUD, categorised and GST-flagged, budgeted by financial year — ready for your accountant.' },
  { icon: Package, title: 'Inventory', tone: 'earth', desc: 'Chemicals, fertiliser, feed and parts with low-stock alerts so you’re never caught short mid-season.' },
  { icon: CloudRain, title: 'Weather & Rainfall', tone: 'sky', desc: 'Live current conditions and a running rainfall history for every paddock, pulled straight from the Bureau.' },
  { icon: CheckSquare, title: 'Tasks', tone: 'farm', desc: 'Assign jobs to the team, link them to a paddock or a machine, and never lose track of what’s overdue.' },
  { icon: ShieldCheck, title: 'Compliance', tone: 'earth', desc: 'Chemical use register, MSDS sheets, PIC and biosecurity records, all in one auditable place.' },
  { icon: FileBarChart, title: 'Reports & Export', tone: 'sky', desc: 'One-click PDF and CSV exports for the bank, the accountant, or the auditor.' },
  { icon: Users, title: 'Team & Access', tone: 'sky', desc: 'Owners, managers, operators, agronomists and accountants each get their own role — with a shared contact directory reachable straight from Tractor Mode.' },
  { icon: MessageCircle, title: 'Farm Chat', tone: 'sky', desc: 'A shared, farm-wide chat so updates and heads-ups reach everyone in real time — no relayed messages, no missed texts.' },
] as const;

const FEATURE_TONE = {
  farm:  { tile: 'from-farm-100 to-farm-200 dark:from-farm-900/40 dark:to-farm-800/40', icon: 'text-farm-700 dark:text-farm-400' },
  earth: { tile: 'from-earth-100 to-earth-200 dark:from-earth-900/40 dark:to-earth-800/40', icon: 'text-earth-700 dark:text-earth-400' },
  sky:   { tile: 'from-sky-50 to-sky-100 dark:from-sky-900/30 dark:to-sky-800/30', icon: 'text-sky-700 dark:text-sky-400' },
} as const;

const FARM_TYPES = [
  'Cropping', 'Livestock', 'Dairy', 'Poultry', 'Horticulture',
  'Aquaculture', 'Mixed', 'Vineyard', 'Sugar', 'Cotton',
];

const PADDOCK_MOCK = [
  { name: 'North Block', color: 'bg-farm-500', clip: 'polygon(6% 0%, 100% 9%, 93% 100%, 0% 91%)', style: { gridColumn: '1 / 3', gridRow: '1 / 3' } },
  { name: 'Home Paddock', color: 'bg-earth-400', clip: 'polygon(0% 12%, 90% 0%, 100% 85%, 8% 100%)', style: { gridColumn: '3 / 5', gridRow: '1 / 2' } },
  { name: 'River Flat', color: 'bg-sky-500', clip: 'polygon(4% 5%, 96% 0%, 100% 95%, 2% 100%)', style: { gridColumn: '3 / 4', gridRow: '2 / 4' } },
  { name: 'East 40', color: 'bg-farm-700', clip: 'polygon(0% 0%, 94% 6%, 100% 100%, 6% 96%)', style: { gridColumn: '4 / 5', gridRow: '2 / 4' } },
  { name: 'Back Paddock', color: 'bg-earth-600', clip: 'polygon(8% 0%, 100% 8%, 92% 100%, 0% 88%)', style: { gridColumn: '1 / 3', gridRow: '3 / 4' } },
];

// Decorative topographic contour lines — evokes elevation/land contours,
// literally on-subject for a mapping product. Deliberately simple paths.
function ContourLines({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 800 400" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,60 C150,20 300,100 450,60 C600,20 750,80 800,60" stroke={color} strokeWidth="1.5" />
      <path d="M0,140 C150,100 300,180 450,140 C600,100 750,160 800,140" stroke={color} strokeWidth="1.5" />
      <path d="M0,220 C150,180 300,260 450,220 C600,180 750,240 800,220" stroke={color} strokeWidth="1.5" />
      <path d="M0,300 C150,260 300,340 450,300 C600,260 750,320 800,300" stroke={color} strokeWidth="1.5" />
      <path d="M0,380 C150,340 300,400 450,380 C600,340 750,400 800,380" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// Seal mark: circular "Australian Owned" stamp with the Southern Cross
// (Crux) picked out in dots — the constellation on the flag, not the flag
// itself, so it reads as a badge rather than a decoration lifted wholesale.
function SovereignSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5" opacity="0.6" />
      <defs>
        <path id="sealTop" d="M 26,104 A 74,74 0 0 1 174,104" fill="none" />
        <path id="sealBottom" d="M 26,100 A 74,74 0 0 0 174,100" fill="none" />
      </defs>
      <text fontSize="11.5" fontWeight="700" letterSpacing="3" fill="currentColor">
        <textPath href="#sealTop" startOffset="50%" textAnchor="middle">AUSTRALIAN OWNED</textPath>
      </text>
      <text fontSize="11.5" fontWeight="700" letterSpacing="3" fill="currentColor">
        <textPath href="#sealBottom" startOffset="50%" textAnchor="middle">SOVEREIGN SOFTWARE</textPath>
      </text>
      {/* Southern Cross (Crux) — elongated kite, not a symmetric diamond:
          Gacrux (top), Acrux (bottom, brightest), Becrux (right arm),
          Decrux (left arm, higher than the right), Epsilon (small, off-axis) */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.45">
        <line x1="99" y1="42" x2="138" y2="110" />
        <line x1="138" y1="110" x2="113" y2="158" />
        <line x1="113" y1="158" x2="76" y2="92" />
        <line x1="76" y1="92" x2="99" y2="42" />
      </g>
      <g fill="currentColor">
        <circle cx="99" cy="42" r="3.5" />
        <circle cx="138" cy="110" r="4" />
        <circle cx="113" cy="158" r="5" />
        <circle cx="76" cy="92" r="3.5" />
        <circle cx="103" cy="128" r="2" />
      </g>
    </svg>
  );
}

function Eyebrow({ icon: Icon, children, tone = 'dark' }: { icon: typeof Wheat; children: React.ReactNode; tone?: 'dark' | 'light' | 'earth' }) {
  const toneClass = {
    dark: 'bg-white/10 text-farm-200',
    light: 'bg-farm-100 text-farm-700',
    earth: 'bg-earth-100 text-earth-700',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full text-xs font-bold uppercase tracking-wide px-3 py-1 mb-5 ${toneClass}`}>
      <Icon className="w-3.5 h-3.5" />
      {children}
    </span>
  );
}

/**
 * Scroll-triggered fade-up, built so a slow/blocked/erroring script degrades
 * to "no animation" rather than "content never appears":
 *
 * - Renders fully visible by default (no opacity-0 baked into the initial
 *   markup) — if this effect never runs at all, nothing is ever hidden.
 * - Only switches to the hidden starting state once IntersectionObserver is
 *   confirmed available and the effect has actually run.
 * - Unobserves after the first reveal — this fires once, not on every scroll.
 */
function Reveal({ children, className = '', delayMs = 0 }: { children: React.ReactNode; className?: string; delayMs?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'static' | 'hidden' | 'visible'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    setPhase('hidden');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('visible');
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    // Safety net: a large instant scroll jump (End key, scroll restoration,
    // etc.) can carry an element straight from below the viewport to above
    // it without ever rendering an intermediate frame, so the observer never
    // sees it intersect. Force-reveal after a bounded wait so nothing stays
    // invisible forever.
    const fallback = window.setTimeout(() => setPhase('visible'), 1800);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const motion = phase === 'hidden' ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0';
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${motion} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { setDemoMode } = useAppStore();
  const { loadDemoData } = useDataStore();

  const tryDemo = () => {
    loadDemoData();
    setDemoMode(true);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b transition-shadow duration-300 ${
          scrolled ? 'border-farm-100 dark:border-gray-800 shadow-sm' : 'border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-farm-600 flex items-center justify-center flex-shrink-0">
              <Wheat className="w-4.5 h-4.5 text-white" />
            </span>
            FarmMap
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-farm-700 dark:hover:text-farm-400">Features</a>
            <a href="#tractor-mode" className="hover:text-farm-700 dark:hover:text-farm-400">Tractor Mode</a>
            <a href="#integrations" className="hover:text-farm-700 dark:hover:text-farm-400">Integrations</a>
            <a href="#compliance" className="hover:text-farm-700 dark:hover:text-farm-400">Compliance</a>
            <a href="#australian-owned" className="hover:text-farm-700 dark:hover:text-farm-400">Aussie Owned</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-farm-700 dark:hover:text-farm-400 px-3 py-2">
              Sign In
            </Link>
            <Link to="/login" className="btn-primary">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-gray-600 dark:text-gray-300"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-farm-100 dark:border-gray-800 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#tractor-mode" onClick={() => setMenuOpen(false)}>Tractor Mode</a>
            <a href="#integrations" onClick={() => setMenuOpen(false)}>Integrations</a>
            <a href="#compliance" onClick={() => setMenuOpen(false)}>Compliance</a>
            <a href="#australian-owned" onClick={() => setMenuOpen(false)}>Aussie Owned</a>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="font-semibold text-farm-700 dark:text-farm-400">Sign In</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary justify-center">Get Started</Link>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden bg-gradient-to-br from-farm-900 via-farm-800 to-earth-900">
        <ContourLines className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none animate-drift" color="#bbf7d0" />
        <Compass className="absolute -right-6 top-8 w-40 h-40 text-farm-200/10 pointer-events-none hidden lg:block" strokeWidth={0.75} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <Eyebrow icon={Compass} tone="dark">Built for Australian farms</Eyebrow>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-white leading-[1.02] tracking-tight text-balance">
              Run the whole farm from <em className="italic bg-gradient-to-r from-farm-300 via-emerald-200 to-earth-200 bg-clip-text text-transparent">one map.</em>
            </h1>
            <p className="mt-6 text-lg text-farm-100/90 max-w-xl">
              FarmMap brings paddocks, livestock, crops, equipment, finances and compliance
              records into a single map-first view — so you can stop chasing spreadsheets
              and start seeing your property the way you actually work it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 bg-farm-500 hover:bg-farm-400 text-farm-950 font-bold px-5 py-3 rounded-xl transition-all text-sm shadow-lg shadow-farm-400/20 hover:shadow-farm-400/40 hover:-translate-y-0.5">
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={tryDemo}
                className="inline-flex items-center gap-2 border-2 border-dashed border-farm-300/60 text-farm-100 hover:bg-white/5 font-bold px-5 py-3 rounded-xl transition-colors text-sm"
              >
                <PlayCircle className="w-4 h-4" />
                Try the Demo
              </button>
            </div>
            <p className="mt-4 text-xs text-farm-300/80">No card required — the demo runs entirely with sample data in your browser.</p>
          </div>

          {/* Hero visual: stylised paddock map, framed like a real browser window */}
          <div className="relative animate-fade-up [animation-delay:150ms]">
            <div className="absolute -inset-10 bg-farm-400/20 blur-3xl rounded-full -z-10" aria-hidden="true" />
            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-black/5">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-farm-300" />
                <span className="ml-2 flex-1 text-center text-[10px] font-mono text-gray-400 bg-white dark:bg-gray-900 rounded-md py-1 truncate px-2">
                  app.farmmap.com.au/paddocks
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Map className="w-4 h-4 text-farm-600" />
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Home Farm — Paddocks</span>
                </div>
                <div className="grid grid-cols-4 grid-rows-3 gap-1.5 h-56 sm:h-64">
                  {PADDOCK_MOCK.map((p) => (
                    <div key={p.name} style={p.style} className="relative">
                      <div
                        className={`${p.color} absolute inset-0 flex items-end p-2.5 transition-transform hover:scale-[1.03]`}
                        style={{ clipPath: p.clip }}
                      >
                        <span className="text-[10px] sm:text-xs font-semibold text-white/95 drop-shadow">{p.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between px-1 text-xs text-gray-400">
                  <span>5 paddocks · 240 ha</span>
                  <span className="inline-flex items-center gap-1 text-farm-600 font-semibold"><Check className="w-3 h-3" /> Synced</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-16 -left-8 hidden sm:block rounded-xl bg-white dark:bg-gray-900 shadow-xl px-4 py-3 -rotate-2 ring-1 ring-black/5">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Rainfall this month</p>
              <p className="text-xl font-extrabold text-sky-600">38<span className="text-sm font-semibold text-gray-400"> mm</span></p>
            </div>
            <div className="absolute -top-4 -right-4 hidden sm:flex items-center gap-1.5 rounded-full bg-sky-600 text-white text-[10px] font-bold px-3 py-1.5 shadow-xl rotate-3">
              <MapPin className="w-3 h-3" /> GPS active
            </div>
          </div>
        </div>
      </section>

      {/* ── Farm types strip ───────────────────────────────────────────── */}
      <section className="border-b border-farm-100 dark:border-gray-800 bg-farm-50 dark:bg-gray-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs uppercase tracking-wide font-bold text-gray-400 mr-2">Works for</span>
          {FARM_TYPES.map((t) => (
            <span
              key={t}
              className="text-xs font-semibold text-farm-700 dark:text-farm-300 bg-white dark:bg-gray-900 border border-farm-200 dark:border-farm-800 rounded-full px-3 py-1"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="relative overflow-hidden max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="absolute -top-16 -right-24 w-72 h-72 rounded-full bg-farm-200/40 dark:bg-farm-800/10 blur-3xl -z-10" aria-hidden="true" />
        <div className="absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-sky-100/50 dark:bg-sky-900/10 blur-3xl -z-10" aria-hidden="true" />
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <Eyebrow icon={Map} tone="light">The platform</Eyebrow>
          <h2 className="font-display text-4xl font-bold tracking-tight text-balance">Every part of the farm, one system</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Replace the paper diary, the spray logbook and the shed full of folders with records
            that live on the map where the work actually happens.
          </p>
        </Reveal>
        <Reveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" delayMs={100}>
          {FEATURES.map(({ icon: Icon, title, desc, tone }) => (
            <div
              key={title}
              className="card group hover:shadow-lg hover:-translate-y-0.5 hover:border-farm-300 dark:hover:border-farm-700 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${FEATURE_TONE[tone].tile} ring-1 ring-black/5 dark:ring-white/5 shadow-sm flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${FEATURE_TONE[tone].icon}`} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ── Tractor Mode ────────────────────────────────────────────────── */}
      <section id="tractor-mode" className="relative overflow-hidden bg-farm-900">
        <ContourLines className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none animate-drift" color="#4ade80" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="order-2 lg:order-1">
            <div className="rounded-2xl bg-farm-950 border border-farm-700/50 p-4 shadow-2xl">
              {/* Mini tab bar */}
              <div className="flex items-center gap-1 bg-farm-900 rounded-xl p-1 mb-3">
                {['Overview', 'Map', 'Team'].map((t) => (
                  <span
                    key={t}
                    className={`flex-1 text-center text-[11px] font-bold py-1.5 rounded-lg transition-colors ${
                      t === 'Map' ? 'bg-farm-500 text-farm-950' : 'text-farm-300'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              {/* Mini live map */}
              <div className="relative rounded-xl bg-farm-800 h-40 overflow-hidden">
                <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_40%,rgba(34,197,94,0.35),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(14,116,144,0.3),transparent_50%)]" />
                <span className="absolute top-2 left-2 bg-farm-950/90 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                  Currently in North Flat
                </span>
                <span className="absolute top-2 right-2 bg-sky-900/80 text-sky-300 text-[10px] font-bold px-2 py-1 rounded-lg">
                  GPS active
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <span className="absolute w-6 h-6 rounded-full bg-sky-400/30 animate-ping" />
                  <span className="w-3 h-3 rounded-full bg-sky-400 ring-2 ring-white/80" />
                </span>
              </div>
              {/* Live alert toasts */}
              <div className="mt-3 space-y-1.5">
                <div className="bg-farm-800 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs font-semibold text-farm-100">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  Entered North Flat
                  <span className="ml-auto text-farm-400 font-normal">just now</span>
                </div>
                <div className="bg-farm-800 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs font-semibold text-farm-100">
                  <BellRing className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  Low stock: Cereal Hay
                  <span className="ml-auto text-farm-400 font-normal">2m ago</span>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2" delayMs={100}>
            <Eyebrow icon={Tractor} tone="dark">In the cab</Eyebrow>
            <h2 className="font-display text-4xl font-bold text-white tracking-tight text-balance">Built to be used from the cab, not just the office</h2>
            <p className="mt-4 text-farm-200/90">
              Register a tablet once and it launches straight into Tractor Mode — big, glove-friendly
              buttons, a live map, and your team, all in one screen.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Live GPS position while Tractor Mode is open, with a plain-English status always on screen',
                'Geofence alerts the moment you cross into or out of a paddock, logged automatically',
                'Overdue tasks, low stock and equipment service pop up instantly — with browser push notifications so you don’t miss them even when FarmMap isn’t the active tab',
                'Tap-to-call your team straight from the cab — no hunting for a number',
                'Register a device once; revoke it centrally from any browser if a tablet goes missing',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-farm-100/90">
                  <Check className="w-4 h-4 text-farm-400 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Integrations ────────────────────────────────────────────────── */}
      <section id="integrations" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <Eyebrow icon={RefreshCw} tone="light">Connected</Eyebrow>
          <h2 className="font-display text-4xl font-bold tracking-tight text-balance">Plugs into the tools you already run</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            FarmMap doesn't ask you to abandon your equipment telematics or your accounting software —
            it syncs with them, so the numbers in your reports match what's actually happening on the ground.
          </p>
        </Reveal>

        {/* Hub-and-spoke: FarmMap in the middle, everything else plugs in */}
        <Reveal className="flex items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto mb-14">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-farm-500/40 blur-lg -z-10" aria-hidden="true" />
            <div className="w-12 h-12 rounded-2xl bg-farm-700 flex items-center justify-center shadow-lg shadow-farm-700/20 ring-1 ring-white/20">
              <Wheat className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 relative border-t-2 border-dashed border-farm-200 dark:border-farm-800">
            <RefreshCw className="w-3.5 h-3.5 text-farm-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-950 rounded-full" />
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            {INTEGRATIONS.map(({ icon: Icon, name }) => (
              <div
                key={name}
                title={name}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border-2 border-farm-200 dark:border-farm-800 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Icon className="w-5 h-5 text-farm-700 dark:text-farm-400" />
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="grid sm:grid-cols-3 gap-5" delayMs={100}>
          {INTEGRATIONS.map(({ icon: Icon, name, desc }) => (
            <div key={name} className="card hover:shadow-lg hover:-translate-y-0.5 hover:border-farm-300 dark:hover:border-farm-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-farm-600 to-farm-800 ring-1 ring-black/5 shadow-md shadow-farm-900/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{name}</h3>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </Reveal>
        <p className="mt-6 text-center text-xs text-gray-400">
          Each connection is a one-time setup by the farm owner from Settings — your credentials are
          never stored in the browser.
        </p>
      </section>

      {/* ── Compliance ──────────────────────────────────────────────────── */}
      <section id="compliance" className="relative overflow-hidden max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-earth-100/60 dark:bg-earth-900/10 blur-3xl -z-10" aria-hidden="true" />
        <Reveal>
          <Eyebrow icon={ShieldCheck} tone="earth">Audit-ready</Eyebrow>
          <h2 className="font-display text-4xl font-bold tracking-tight text-balance">Compliance paperwork, sorted automatically</h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Every spray job you log builds your chemical use register, complete with withholding
            periods, so it's ready the moment an auditor, agronomist or buyer asks for it.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Chemical use register generated from your spray records',
              'MSDS, PIC and biosecurity documents in one place',
              'Withholding-period alerts before you sell or harvest',
              'NVD-ready export for livestock and produce sales',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-4 h-4 text-farm-600 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="card" delayMs={100}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm">Chemical Use Register</span>
            <span className="badge bg-farm-100 text-farm-700">Current</span>
          </div>
          <div className="space-y-2.5">
            {[
              { name: 'Glyphosate 450', paddock: 'North Block', whp: 7 },
              { name: 'Trifluralin 480', paddock: 'East 40', whp: 0 },
              { name: 'Chlorpyrifos 500', paddock: 'River Flat', whp: 14 },
            ].map((r) => (
              <div
                key={r.name}
                className={`flex items-center justify-between text-sm border-b border-gray-50 dark:border-gray-800 pb-2.5 pl-3 border-l-2 ${r.whp > 0 ? 'border-l-amber-400' : 'border-l-farm-400'}`}
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.paddock}</p>
                </div>
                <span className={`text-xs font-semibold ${r.whp > 0 ? 'text-amber-600' : 'text-farm-600'}`}>
                  {r.whp > 0 ? `${r.whp}d WHP` : 'Clear'}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Australian Owned ────────────────────────────────────────────── */}
      <section id="australian-owned" className="border-t border-farm-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="order-2 lg:order-1 flex justify-center">
            <SovereignSeal className="w-56 h-56 sm:w-64 sm:h-64 text-farm-700 dark:text-farm-400" />
          </Reveal>
          <Reveal className="order-1 lg:order-2" delayMs={100}>
            <Eyebrow icon={BadgeCheck} tone="light">Australian Owned &amp; Operated</Eyebrow>
            <h2 className="font-display text-4xl font-bold tracking-tight text-balance">
              Aussie owned. Aussie built. Aussie run.
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              FarmMap isn't a rebadged overseas platform — it's designed, built and supported right
              here in Australia, by people who know the difference between a header and a harvester.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Australian owned and operated — not a reseller, not a rebrand',
                'Your data is hosted on Australian servers, governed by Australian privacy law',
                'Built around hectares, AUD, GST, NLIS and PIC from day one — not bolted on afterward',
                'Support from people who know what a mob, a header and a withholding period actually are',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-4 h-4 text-farm-600 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-farm-50 dark:bg-gray-900/40 border-t border-farm-100 dark:border-gray-800">
        <ContourLines className="absolute inset-0 w-full h-full opacity-[0.35] dark:opacity-[0.08] pointer-events-none animate-drift" color="#86efac" />
        <Reveal className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-balance">Ready to get off the spreadsheets?</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Create a free account and set up your farm in a couple of minutes, or explore FarmMap
            first with sample data — no sign-up required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn-primary py-3 px-5 text-base">
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={tryDemo}
              className="inline-flex items-center gap-2 border-2 border-dashed border-farm-300 dark:border-farm-700 text-farm-700 dark:text-farm-300 hover:bg-farm-50 dark:hover:bg-farm-900/30 font-semibold px-5 py-3 rounded-xl transition-colors text-base"
            >
              <PlayCircle className="w-4 h-4" />
              Try the Demo
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-farm-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
            <span className="w-7 h-7 rounded-lg bg-farm-600 flex items-center justify-center">
              <Wheat className="w-4 h-4 text-white" />
            </span>
            FarmMap
          </a>
          <p className="text-sm text-gray-400 text-center sm:text-right">
            &copy; {new Date().getFullYear()} FarmMap &middot; Australian owned &amp; operated
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> &middot; </span>
            Built for Australian farmers
          </p>
        </div>
      </footer>
    </div>
  );
}
