# CMO — Brand Guidelines

> The definitive reference for anyone designing, developing, or creating content for CMO.
> Last updated: March 2026

---

## 1. Brand Identity

### Brand Name
**CMO** — always uppercase, always spaced with `letter-spacing: 0.2em` in digital contexts.

### Tagline
**"Your AI Growth Team"**

### One-Liner
*Replace your marketing team with one URL.*

### What CMO Is
CMO is a multi-agent AI marketing tool. You paste a website URL, and 5 specialized AI agents (Strategist, SEO, Copywriter, Conversion, Distribution) analyze it in parallel and return an actionable growth strategy in ~60 seconds — with one-click execution for tweets, blog posts, and ad copy.

### Brand Personality

| Trait | Description | Do | Don't |
|-------|-------------|-----|-------|
| **Direct** | Say what you mean in fewer words | "5 agents. 60 seconds. Done." | "Our innovative platform leverages..." |
| **Technical** | Respect the builder audience | Reference real frameworks (PAS, LIFT) | Vague buzzwords ("AI-powered solution") |
| **Confident** | Know the product is good | "$5 vs $5,000/month" | "We think this might help" |
| **Honest** | Never overpromise | "3 free analyses, then $5" | "Unlimited free forever" |
| **Founder-voiced** | Sound like a person, not a company | "I built this because..." | "CMO Corporation is pleased to announce..." |

---

## 2. Color System

### Primary Palette

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Background** | `#09090b` | `zinc-950` | Page background, dark surfaces |
| **Surface** | `rgba(24,24,27,0.5)` | `zinc-900/50` | Cards, panels, bento items |
| **Surface Hover** | `rgba(24,24,27,0.8)` | `zinc-900/80` | Hovered cards |
| **Text Primary** | `#f4f4f5` | `zinc-100` | Headlines, body text |
| **Text Secondary** | `#a1a1aa` | `zinc-400` | Descriptions, subtext |
| **Text Muted** | `#71717a` | `zinc-500` | Labels, captions |
| **Icon Background** | `rgba(255,255,255,0.1)` | `white/10` | Icon containers |
| **Success/Positive** | `#ffffff` | `white` | Checkmarks, positive indicators |
| **Border** | `rgba(255,255,255,0.05)` | `white/5` | Card borders, dividers |
| **Border Hover** | `rgba(255,255,255,0.1)` | `white/10` | Hovered borders |

### Chat App Palette (Light Mode)

| Name | CSS Variable | Hex | Usage |
|------|-------------|-----|-------|
| **Background** | `--color-bg` | `#f5f5f3` | Page background |
| **Panel** | `--color-panel` | `rgba(255,255,255,0.9)` | Chat panels |
| **Foreground** | `--color-fg` | `#111111` | Text |
| **Muted** | `--color-muted` | `#6b6b6b` | Secondary text |
| **Accent** | `--color-accent` | `#171717` | Buttons, selections |

### Color Rules
1. **Strictly Monochromatic**: No non-grayscale colors are allowed in the design (e.g., no blue, red, green, purple).
2. **Landing page** = dark theme (`zinc-950` background)
3. **Chat app** (`/app`) = light theme (`#f5f5f3` background)
4. Borders are always `white/5` to `white/20` — never solid white

---

## 3. Typography

### Font Stack

```css
font-family: "Avenir Next", "Helvetica Neue", "Segoe UI", sans-serif;
```

System-native. No external font loading. Fast render.

### Type Scale (Landing Page)

| Element | Size (mobile) | Size (desktop) | Weight | Tracking |
|---------|--------------|----------------|--------|----------|
| Hero H1 | `text-4xl` (36px) | `text-7xl` (72px) | `extrabold` (800) | `-0.04em` |
| Section H2 | `text-2xl` (24px) | `text-4xl` (36px) | `bold` (700) | default |
| Card H3 | `text-sm` (14px) | `text-lg` (18px) | `bold` (700) | default |
| Body | `text-xs` (12px) | `text-sm` (14px) | `normal` (400) | default |
| Caption | `text-[10px]` | `text-xs` (12px) | `normal` (400) | `wide` |
| Logo | `text-base` (16px) | `text-lg` (18px) | `bold` (700) | `0.2em` |

### Typography Rules
1. Headlines: **white** (`zinc-100`)
2. Body text: **zinc-400**
3. Captions/labels: **zinc-500** or **zinc-600**
4. Maximum line width: `max-w-3xl` for body, `max-w-xl` for subheadings
5. Line height: `leading-[1.08]` for hero, `leading-7` for body

---

## 4. Iconography

### Icon Library
**Lucide React** — MIT licensed, tree-shakeable, 300+ icons.

```bash
npm install lucide-react
```

### Icon Mapping

| Context | Icon | Lucide Name |
|---------|------|-------------|
| Growth Strategy | Target crosshair | `Target` |
| Viral Hooks | Anchor | `Anchor` |
| SEO | Magnifying glass | `Search` |
| Conversion | Lightning bolt | `Zap` |
| Distribution | Megaphone | `Megaphone` |
| Strategist Agent | Brain | `Brain` |
| Copywriter Agent | Pen | `PenLine` |
| Drop URL step | Link chain | `Link2` |
| AI Agents step | Robot | `Bot` |
| Launch/CTA | Rocket | `Rocket` |
| Reddit | Dot circle | `CircleDot` |
| Auto-publish | Upload arrow | `Upload` |
| Autonomous | Refresh loop | `RefreshCw` |
| Web3/Crypto | Gem | `Gem` |
| Execution | Gear | `Settings` |
| Memory | Brain | `Brain` |
| Positive/Check | Checkmark | `Check` |
| Negative/No | X mark | `X` |
| Navigation arrow | Right arrow | `ArrowRight` |
| Scroll indicator | Down arrow | `ArrowDown` |
| Twitter/X | Bird | `Twitter` |
| GitHub | Octocat | `Github` |

### Icon Styling Rules

```tsx
// Card/section icons — contained in rounded background
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
  <Icon className="h-5 w-5 text-white" />
</div>

// Inline icons (headings, buttons) — no background
<Icon className="h-4 w-4 text-white" />

// Footer social icons — inherit text color
<Icon className="h-4 w-4" />
```

1. **Card icons**: Always inside a `bg-white/10` container with `rounded-xl`
2. **Icon color**: `text-white` for feature/section icons
3. **Icon sizes**: `h-5 w-5` in card containers, `h-4 w-4` inline, `h-3.5 w-3.5` in buttons
4. **Never** use emojis — always use Lucide SVG icons

---

## 5. Layout & Spacing

### Breakpoints (Tailwind defaults)

| Breakpoint | Min Width | Common Use |
|------------|-----------|------------|
| (default) | 0px | Mobile |
| `sm` | 640px | Large phone / tablet |
| `md` | 768px | Tablet landscape |
| `lg` | 1024px | Desktop |

### Content Width
- Max content: `max-w-5xl` (agents, features)
- Max readable: `max-w-3xl` (demo, pricing, comparison)
- Max hero text: `max-w-xl` for subheading

### Spacing Pattern
- Section padding: `py-20` mobile, `py-28` desktop
- Horizontal padding: `px-5` mobile, `px-8` desktop
- Card padding: `p-6` mobile, `p-8` desktop
- Grid gaps: `gap-4` to `gap-8`

### Card Design
```
rounded-2xl
border border-white/5
bg-zinc-900/50
hover:border-white/10
hover:bg-zinc-900/80
transition
```

---

## 6. Components

### Buttons

| Variant | Style | Use |
|---------|-------|-----|
| **Primary** | `bg-white text-zinc-950 rounded-full font-bold` | Main CTAs ("Try free", "Launch CMO") |
| **Ghost** | `border border-white/20 text-zinc-300 rounded-full` | Secondary actions ("See how it works") |

All buttons include `transition` and `hover:` state. Always `rounded-full`.

### Comparison Table Indicators
- **Supported**: `<Check className="h-4 w-4 text-white" />`
- **Not supported**: `<X className="h-4 w-4 text-zinc-600" />`

### Navbar
- Position: `fixed top-0 inset-x-0 z-50`
- Background: `bg-zinc-950/70 backdrop-blur-xl`
- Border: `border-b border-white/5`

---

## 7. Animation

### Scroll Fade-In
Elements animate in as the user scrolls. Handled by `IntersectionObserver`.

```css
.fade-in-hidden {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-in-visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Hero Design
Minimalist background with no colorful gradients or floating 3D objects. Only stark typography.

### Animation Rules
1. All animations are CSS-only — no JS animation libraries
2. Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)
3. Duration: 0.7s for scroll-fade, 8s for gradient pulse
4. Card hovers: `transition` class (150ms default)

---

## 8. Voice & Tone

### Writing Rules
1. **Short sentences**. If it's longer than 15 words, split it.
2. **Active voice**. "CMO analyzes your site" not "Your site is analyzed by CMO."
3. **Second person**. "Your growth strategy" not "A growth strategy."
4. **Specific > vague**. "$5 per analysis" not "affordable pricing."
5. **No marketing buzzwords**. Ban: "innovative", "cutting-edge", "revolutionary", "leverage", "synergy."
6. **Founder voice**. Write like you're explaining it to another builder, not selling to a customer.

### Banned Phrases
- "AI-powered solution"
- "One-stop shop"
- "Next-generation"
- "Cutting-edge technology"
- "Best-in-class"
- "World-class"
- "Seamless integration"

### Approved Phrasing

| Instead of | Say |
|-----------|-----|
| "Get started with your free trial" | "Try free — no card needed" |
| "Subscribe to our premium plan" | "$5 per analysis. No subscription." |
| "Our AI-powered platform" | "5 AI agents" |
| "Seamless user experience" | "Paste a URL. Get a strategy." |
| "Contact sales" | Never. There is no sales team. |

---

## 9. Logo Usage

### Primary Logo
Text-only: **CMO** in bold, uppercase, `letter-spacing: 0.2em`

```tsx
<span className="text-base font-bold tracking-[0.2em] text-white sm:text-lg">
  CMO
</span>
```

### Rules
1. Always white on dark backgrounds
2. Always `tracking-[0.2em]`
3. Never add a graphic mark — the product is the wordmark
4. Minimum size: 14px
5. Clear space: minimum 0.5em on all sides

---

## 10. Tech Stack Reference

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 | App router, SSR/SSG |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Icons | Lucide React | SVG icon system |
| AI Inference | Fireworks AI | Multi-agent LLM calls |
| Scraping | Jina Reader API | URL → clean markdown |
| Auth & Wallets | Privy | Email/Google login + embedded crypto wallet |
| Payments | USDC on Arc Testnet | $5 per analysis |
| Storage | Vercel KV | Session + payment records |
| Automation | n8n | Autonomous daily analysis |
| Hosting | Vercel | Edge deployment |
| Analytics | Vercel Analytics | Traffic + speed insights |

---

## 11. File Structure

```
app/
├── page.tsx           # Landing page (dark theme, 10 sections)
├── layout.tsx         # Root layout (SEO metadata)
├── globals.css        # Global styles + animations
├── providers.tsx      # Privy context provider
├── app/
│   ├── page.tsx       # Chat application (light theme)
│   └── layout.tsx     # App-specific layout (light background)
docs/
├── brand-guidelines.md  # This file
└── launch-content/      # Launch copy (tweet threads, PH, Reddit, etc.)
```

---

## 12. Quick Reference Card

```
Theme:         Strict B&W (Monochromatic Minimalist)
Background:    #09090b (zinc-950)
Text:          #f4f4f5 (zinc-100)
Icon bg:       rgba(255,255,255,0.1) (white/10)
Borders:       rgba(255,255,255,0.05) to 0.2
Font:          Avenir Next, Helvetica Neue, system
Icons:         Lucide React (npm install lucide-react)
Corners:       rounded-2xl (cards), rounded-full (buttons)
Animation:     Framer Motion (springs and scroll fade)
```
