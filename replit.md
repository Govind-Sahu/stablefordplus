# Stableford+

A full-stack subscription-driven golf performance tracking, charity fundraising, and monthly prize draw platform.

## Overview

Users subscribe, log Stableford golf scores (1–45, rolling 5 max), participate in monthly draws (3/4/5-number match tiers), and contribute a percentage of their subscription to a charity they choose. An admin panel manages users, draws, charities, and winner verification.

## Architecture

- **Frontend**: React + Vite (port 5000), Tailwind CSS, React Router, JWT auth stored in localStorage
- **Backend**: Express.js REST API (port 3001), ES modules
- **Database**: PostgreSQL (accessed via `DATABASE_URL`)
- **Payments**: Stripe (subscription checkout + customer portal via `/api/subscriptions/*`)
- **Auth**: JWT — tokens issued by `/api/auth/login` and `/api/auth/register`

## Workflows

- **Start application** — runs `npm run dev` on port 5000 (Vite with proxy to backend)
- **Backend** — runs `node server/index.js` on port 3001

## Key Routes

### Frontend
| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login |
| `/register` | Public | Registration |
| `/subscribe` | Auth | Stripe subscription checkout |
| `/dashboard` | Auth | Score entry, draw status, subscription management |
| `/charities` | Public | Charity listing |
| `/charities/:id` | Public | Charity detail |
| `/draws` | Public | Draw history |
| `/draws/:id` | Public | Draw detail + results |
| `/winners` | Public | Winners gallery |
| `/admin` | Admin | Admin dashboard |
| `/admin/users` | Admin | User management |
| `/admin/draws` | Admin | Draw creation, simulation, publish |
| `/admin/charities` | Admin | Charity CRUD |
| `/admin/winners` | Admin | Winner verification & payout |

### Backend API
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user profile |
| GET/POST | `/api/scores` | List / add scores |
| GET | `/api/charities` | List charities |
| GET/POST/PUT/DELETE | `/api/charities/:id` | Charity CRUD (admin) |
| GET | `/api/draws` | List draws |
| POST | `/api/draws` | Create draw (admin) |
| POST | `/api/draws/:id/simulate` | Run draw simulation (admin) |
| POST | `/api/draws/:id/publish` | Publish results (admin) |
| GET | `/api/subscriptions/plans` | Stripe plans |
| POST | `/api/subscriptions/checkout` | Stripe checkout session |
| POST | `/api/subscriptions/portal` | Stripe customer portal |
| GET | `/api/winners` | Public winners list |
| PUT | `/api/winners/:id/verify` | Verify winner (admin) |
| GET | `/api/admin/stats` | Dashboard stats (admin) |

## Seeded Credentials

- **Admin**: `admin@stableford.com` / `Admin@2024!`
- **Demo user**: `demo@stableford.com` / `Demo@2024!`

## Database Schema

Tables: `users`, `golf_scores`, `charities`, `draws`, `draw_entries`, `winners`

Key fields:
- `users.subscription_status`: `active | inactive | cancelled | past_due`
- `users.charity_contribution_pct`: 10–50 (percent of subscription to charity)
- `draws.status`: `pending → simulated → published`
- `draws.algorithm_type`: `random | algorithmic`
- Prize tiers: 5-match (40% jackpot, rolls over), 4-match (35%), 3-match (25%)

## Stripe Integration

The Stripe integration is via the Replit Stripe connector. Connect it in the integrations panel to enable subscription plans. Without Stripe, the app functions for score tracking and draw viewing but payment/subscription flows require Stripe to be configured.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` — Secret for JWT signing (falls back to hardcoded dev value; set this in production)
- Stripe credentials — managed by the Replit Stripe connector

## User Preferences

- Dark-themed UI using Tailwind CSS slate + emerald palette
- ES module syntax throughout (`import/export`, no CommonJS)
- All API calls go through `src/lib/api.js` helper
