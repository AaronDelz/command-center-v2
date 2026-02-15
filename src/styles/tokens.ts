/**
 * THE FORGE — Design Tokens
 * Single source of truth for all visual properties.
 * Every component pulls from here. No hardcoded values.
 *
 * Usage:
 *   import { tokens } from '@/styles/tokens'
 *   style={{ color: tokens.color.text.primary }}
 *
 * For Tailwind, these are mirrored in tailwind.config.ts via the
 * forge theme extension. Prefer Tailwind classes; use tokens directly
 * only in JS-driven animations or dynamic styles.
 *
 * @version 1.0.0
 * @date 2026-02-14
 */

// ─── COLOR PALETTE ──────────────────────────────────────────────

export const color = {
  // Backgrounds (layered depth system — L0 → L3)
  bg: {
    void:     '#07070c',                         // L0: deepest layer (behind ambient orbs)
    base:     '#0d0d14',                         // L0: main page background
    surface:  'rgba(255, 255, 255, 0.03)',       // L1: glass card base
    elevated: 'rgba(255, 255, 255, 0.06)',       // L2: modals, dropdowns
    overlay:  'rgba(255, 255, 255, 0.10)',       // L3: tooltips, popovers
    ash:      '#2a1a10',                         // warm-tinted dark surface
  },

  // Ember accent system (primary)
  ember: {
    DEFAULT:  '#ff6b35',   // primary accent — buttons, active states
    flame:    '#ffb347',   // warm — headers, highlights, gold text
    molten:   '#ff4500',   // hot — alerts, urgency, destructive
    coal:     '#8b2500',   // deep — subtle warm backgrounds
    smolder:  '#5c1a00',   // darkest ember — borders, tints
  },

  // Blue secondary
  blue: {
    DEFAULT:  '#60a5fa',
    light:    '#93c5fd',
    dark:     '#2563eb',
  },

  // Text hierarchy
  text: {
    primary:   '#f0ece6',   // warm white (NOT blue-white)
    secondary: '#8a8494',   // descriptions, metadata
    accent:    '#ffb347',   // section headers (gold)
    dim:       '#555060',   // timestamps, least important
    inverse:   '#0d0d14',   // text on bright backgrounds
  },

  // Status (distinct from accents — never use ember for status)
  status: {
    healthy:  '#4ade80',
    warning:  '#fbbf24',
    error:    '#ef4444',
    info:     '#60a5fa',
  },

  // Status glows (for box-shadow / drop-shadow)
  statusGlow: {
    healthy:  'rgba(74, 222, 128, 0.3)',
    warning:  'rgba(251, 191, 36, 0.3)',
    error:    'rgba(239, 68, 68, 0.3)',
    info:     'rgba(96, 165, 250, 0.3)',
  },

  // Glass properties
  glass: {
    border:       'rgba(255, 255, 255, 0.08)',
    borderHover:  'rgba(255, 107, 53, 0.30)',
    borderFocus:  'rgba(255, 107, 53, 0.50)',
    shine:        'rgba(255, 255, 255, 0.06)',
    shineStrong:  'rgba(255, 255, 255, 0.10)',
  },

  // Ambient background orbs
  ambient: {
    ember:  'rgba(255, 69, 0, 0.12)',
    gold:   'rgba(255, 140, 0, 0.08)',
    coal:   'rgba(139, 37, 0, 0.10)',
  },

  // Kanban column progression (cooler → hotter as cards move right)
  kanban: {
    todo:    '#60a5fa',   // cool blue
    doing:   '#ff6b35',   // ember
    done:    '#4ade80',   // healthy green
  },

  // Category colors (goals, content, etc.)
  category: {
    revenue:       '#ff6b35',
    clients:       '#ffb347',
    health:        '#4ade80',
    content:       '#60a5fa',
    relationships: '#f472b6',
    systems:       '#a78bfa',
  },
} as const

// ─── TYPOGRAPHY ─────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    display: '"Cinzel", serif',                              // masthead only
    heading: '"Geist Sans", system-ui, -apple-system, sans-serif',
    body:    '"Geist Sans", system-ui, -apple-system, sans-serif',
    mono:    '"Geist Mono", "SF Mono", "Fira Code", monospace',
  },

  fontSize: {
    masthead: '1.5rem',     // 24px — Cinzel, main title
    pageTitle: '1.5rem',    // 24px — Geist, page headers
    sectionHeader: '0.75rem', // 12px — uppercase, tracking-wider, gold
    cardTitle: '0.875rem',  // 14px — semi-bold
    body: '0.875rem',       // 14px — regular
    caption: '0.75rem',     // 12px — badges, pills
    metadata: '0.625rem',   // 10px — timestamps
  },

  fontWeight: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },

  letterSpacing: {
    normal:  '0',
    wide:    '0.025em',
    wider:   '0.05em',
    widest:  '0.1em',
  },

  lineHeight: {
    tight:  '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

// ─── SPACING ────────────────────────────────────────────────────

export const spacing = {
  0:   '0',
  px:  '1px',
  0.5: '2px',
  1:   '4px',
  1.5: '6px',
  2:   '8px',
  2.5: '10px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  8:   '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
  20:  '80px',
  24:  '96px',
} as const

// ─── BORDER RADIUS ──────────────────────────────────────────────

export const radius = {
  none: '0',
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',     // standard card
  '2xl': '20px',    // large card / modal
  '3xl': '24px',
  full: '9999px',   // pills, orbs
} as const

// ─── SHADOWS ────────────────────────────────────────────────────

export const shadow = {
  // Glass card depth
  card:     '0 8px 32px rgba(0, 0, 0, 0.4)',
  cardHover: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 107, 53, 0.15)',
  elevated: '0 16px 48px rgba(0, 0, 0, 0.5)',
  modal:    '0 24px 64px rgba(0, 0, 0, 0.6)',

  // Inner shine (used via ::after pseudo)
  innerShine: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',

  // Ember glows
  emberGlow:   '0 0 15px rgba(255, 69, 0, 0.3), 0 0 45px rgba(255, 140, 0, 0.1)',
  emberGlowLg: '0 0 30px rgba(255, 69, 0, 0.4), 0 0 60px rgba(255, 140, 0, 0.15)',
  moltenGlow:  '0 0 20px rgba(255, 69, 0, 0.4), inset 0 0 20px rgba(255, 140, 0, 0.05)',
  forgeCard:   'inset 0 1px 0 rgba(255, 140, 0, 0.1), 0 0 30px rgba(0, 0, 0, 0.5)',

  // Priority borders (kanban left-edge glow)
  priorityHigh:   '0 0 12px rgba(255, 69, 0, 0.5)',
  priorityMedium: '0 0 10px rgba(255, 179, 71, 0.4)',
  priorityLow:    '0 0 8px rgba(96, 165, 250, 0.3)',
} as const

// ─── GLASS EFFECTS ──────────────────────────────────────────────

export const glass = {
  // Backdrop filters per depth level
  blur: {
    card:     'blur(20px) saturate(150%)',   // L1
    elevated: 'blur(30px) saturate(160%)',   // L2
    overlay:  'blur(40px) saturate(170%)',   // L3
    nav:      'blur(20px) saturate(140%)',   // bottom nav / sidebar
  },

  // Mouse-tracking glow (applied as radial-gradient at cursor pos)
  cursorGlow: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 140, 0, 0.08), transparent 50%)',
  cursorGlowStrong: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 140, 0, 0.15), transparent 40%)',
} as const

// ─── ANIMATION ──────────────────────────────────────────────────

export const animation = {
  // Durations
  duration: {
    instant:  '0ms',
    fast:     '100ms',
    normal:   '150ms',
    moderate: '200ms',
    slow:     '300ms',
    slower:   '500ms',
    ambient:  '3000ms',   // breathing / ambient loops
    ambientSlow: '5000ms',
  },

  // Easings
  easing: {
    default:   'cubic-bezier(0.4, 0, 0.2, 1)',   // ease-out
    in:        'cubic-bezier(0.4, 0, 1, 1)',
    out:       'cubic-bezier(0, 0, 0.2, 1)',
    inOut:     'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
    spring:    'cubic-bezier(0.22, 1.0, 0.36, 1.0)',
  },

  // Named keyframe animations (reference — defined in globals.css)
  keyframes: {
    emberFloat:   'ember-float',      // particle rising
    forgePulse:   'forge-pulse',      // button/card pulse
    glowBreathe:  'glow-breathe',     // ambient orb breathing
    flameFill:    'flame-fill',       // progress bar fill
    emberBurst:   'ember-burst',      // success celebration
    slideUp:      'slide-up',         // page enter
    fadeIn:       'fade-in',          // generic appear
    shimmer:      'shimmer',          // progress bar shimmer
  },

  // Hover transforms
  hover: {
    lift:  'translateY(-2px)',
    press: 'scale(0.97)',
    grow:  'scale(1.02)',
  },

  // Stagger delays for children (page transitions)
  stagger: {
    fast:   '50ms',
    normal: '80ms',
    slow:   '120ms',
  },
} as const

// ─── BREAKPOINTS ────────────────────────────────────────────────

export const breakpoint = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
} as const

// ─── LAYOUT ─────────────────────────────────────────────────────

export const layout = {
  sidebar: {
    width: '280px',
    collapsedWidth: '72px',
  },
  maxContentWidth: '1400px',
  bottomNav: {
    height: '64px',
    safeArea: '34px',   // iPhone notch
  },
  cardGap: '16px',
  sectionGap: '24px',
  pageGutter: '24px',    // desktop
  pageGutterMobile: '16px',
} as const

// ─── Z-INDEX SCALE ──────────────────────────────────────────────

export const zIndex = {
  background:  -10,
  base:          0,
  card:          1,
  sticky:       10,
  sidebar:      20,
  dropdown:     30,
  modal:        40,
  modalOverlay: 39,
  toast:        50,
  tooltip:      60,
  bottomNav:    30,
} as const

// ─── PERFORMANCE LIMITS ─────────────────────────────────────────

export const limits = {
  maxAmbientOrbs: 3,
  maxEmberParticles: 20,
  maxVisibleGlassCards: 10,   // with backdrop-filter
  maxAnimatedElements: 15,
} as const

// ─── AGGREGATE EXPORT ───────────────────────────────────────────

export const tokens = {
  color,
  typography,
  spacing,
  radius,
  shadow,
  glass,
  animation,
  breakpoint,
  layout,
  zIndex,
  limits,
} as const

export default tokens
