# March Madness Snake Draft Scorer

Mobile-only (max-width 600px) app for running an 8-person snake draft and scoring March Madness by **seed × round**. Built with Next.js (App Router) and Supabase, retro 8-bit aesthetic.

## Setup

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In SQL Editor, run `supabase/migrations/001_schema.sql`.
   - In Dashboard → Database → Replication, add **teams** and **games** to the Realtime publication.

2. **Env**
   - Copy `.env.local.example` to `.env.local`.
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings.

3. **Run**
   - `npm install` then `npm run dev`.
   - Open [http://localhost:3000](http://localhost:3000).

## Flow

- **Phase 1 — Setup:** `/admin/setup` — paste bracket JSON, import teams and generate R64 (and all later round) games.
- **Phase 2 — Draft:** `/admin/draft-order` — set 8 player names in pick order. `/admin/draft-admin` — record picks; `/live-draft` — display available teams for the room.
- **Phase 3 — Tournament:** `/bracket` — tap games to set winner (advances team to next round). `/scoreboard` — live scores. `/draft` — rosters.

## Scoring

Points per win = **winner’s seed × round number** (Round of 64 = 1, R32 = 2, … Championship = 6). First Four play-in games are not scored.

## Routes

| Route | Purpose |
|-------|--------|
| `/` | Home + links |
| `/bracket` | Bracket tabs, game cards, set winner modal |
| `/scoreboard` | Ranked scores + teams remaining |
| `/draft` | Player rosters |
| `/admin/setup` | Bracket JSON import |
| `/admin/draft-order` | Set 8 player names |
| `/admin/draft-admin` | Record draft picks, undo last |
| `/live-draft` | Read-only available teams |

No authentication; admin routes are security-by-obscurity.
