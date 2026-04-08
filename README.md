# Flow Timer — ADHD-Friendly Pomodoro

A minimalist, distraction-free Pomodoro timer designed specifically for people with ADHD. Features a flow state mode that lets you keep going when you're in the zone, detailed analytics to track your productivity patterns, and a beautiful dark-first UI.

## Features

- **Flexible Focus Timer** — Quick duration presets (5/10/15/20/25 min) or custom settings
- **Flow State Detection** — Timer continues past the planned duration so you never lose your momentum
- **Session Timeline** — Visual dots showing progress through your focus/break cycle
- **Analytics Dashboard** — Charts and insights about your focus habits over time
- **Dark & Light Themes** — Automatic system detection or manual toggle
- **PWA Ready** — Installable as a standalone app on mobile
- **Data Persistence** — Sessions saved to localStorage with JSON export
- **Accessibility** — Keyboard navigation, screen reader support, reduced motion

## Tech Stack

- **React 19** + **TypeScript** — Component-based UI with strict types
- **Vite** — Fast dev server and optimized builds
- **Zustand** — Lightweight state management
- **Chart.js** — Session analytics charts
- **Vitest** + **Testing Library** — tests for domain logic and stores
- **ESLint** + **typescript-eslint** + **eslint-plugin-react-hooks** — `npm run lint`
- **Iconify** (Ming Cute) — `@iconify/react` + `@iconify-icons/mingcute`

## Getting Started

```bash
npm install
npm run dev        # Start dev server at localhost:5173
npm test           # Run test suite
npm run lint       # ESLint on src/
npm run build      # Production build to dist/
```

## Project Structure

```
src/
├── lib/           # Pure domain logic + chart helpers; optional barrel `lib/index.ts`
├── stores/        # Zustand stores; optional barrel `stores/index.ts`
├── hooks/         # Shared hooks (theme sync, compact layout); optional barrel `hooks/index.ts`
├── components/    # React components + co-located `*.module.css`
│   ├── Timer/     # TimerView, ring, display, controls, debug panel
│   ├── Settings/  # Settings form
│   └── Analytics/ # Charts, stats, insights
├── styles/        # tokens.css, global.css only
└── test/          # Test setup
```

## Deploy

Deploys automatically to GitHub Pages on push to `main` via the included GitHub Actions workflow. The workflow runs tests, type-checks, builds, and deploys the `dist/` folder.

## License

MIT
