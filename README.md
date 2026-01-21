# Guest List Sign-Up Middleware

A lightweight web app for nightclub bookers to create gig-specific guest list sign-up forms. DJs receive shareable links, guests enter their name/email/+1s, and bookers export CSVs in Resident Advisor format.

## Features

- **Gig Creation** - Create guest lists with DJ name, date, venue, and optional guest caps
- **Shareable Links** - Each gig gets a unique URL for DJs to share with their guests
- **Guest Sign-up** - Mobile-friendly forms for guests to RSVP with +1s
- **Dashboard** - List and calendar views to see all gigs, guest counts, close/reopen lists
- **CSV Export** - One-click download in Resident Advisor format
- **Guest Cap Enforcement** - Automatic list closure when capacity is reached
- **Date Conflict Warning** - Confirmation popup when creating gig on date with existing events

## Screenshots

The app features a clean, pill-shaped button design with Helvetica font and muted color palette.

### Pages
- `/` - Create new guest list form
- `/gig/[slug]` - Guest sign-up form (shareable link)
- `/success/[slug]` - Sign-up confirmation page
- `/dashboard` - View all gigs (list or calendar view)
- `/dashboard/[slug]` - Gig detail with guest list table

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + SQLite (local) / PostgreSQL (production via Supabase)
- Playwright (e2e tests)

## Local Development

```bash
# Install dependencies
npm install

# Run dev server (uses SQLite by default)
npm run dev

# Open http://localhost:3000
```

## Database

### Local Development (SQLite)
The app uses SQLite for local development. The database file is at `prisma/dev.db`.

```bash
# Reset database
rm prisma/dev.db && npx prisma db push
```

### Production (Supabase PostgreSQL)
See deployment section below.

## Deploy to Netlify + Supabase

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > Database**
3. Copy the connection strings:
   - **Connection pooling** URL (for `DATABASE_URL`)
   - **Direct connection** URL (for `DIRECT_URL`)

### 2. Run Database Migration

```bash
# Set your Supabase URLs
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."

# Push schema to Supabase
npx prisma db push
```

### 3. Deploy to Netlify

1. Connect your GitHub repo to [Netlify](https://netlify.com)
2. Add environment variables:
   - `DATABASE_URL` - Supabase pooling connection string
   - `DIRECT_URL` - Supabase direct connection string
3. Deploy!

## Environment Variables

```bash
# Supabase PostgreSQL (production)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-ca-central-1.pooler.supabase.com:5432/postgres"
```

## Supabase MCP (for AI Agents)

This project supports Supabase MCP for AI-assisted database management. See `AGENT_SETUP_INSTRUCTIONS.md` for details.

**Quick setup:**
1. Get an access token from https://supabase.com/dashboard/account/tokens
2. Create `.mcp.json` with the MCP server config
3. Restart your AI tool to load the configuration

## Running Tests

```bash
# Run all tests
npx playwright test

# Run tests with UI
npx playwright test --ui
```

## CSV Export Format

Exports match Resident Advisor's expected format:

| Name | Company | Email | Quantity | Type |
|------|---------|-------|----------|------|
| Guest Name | | guest@email.com | 2 | |

## UI Design System

| Element | Tailwind Class |
|---------|----------------|
| Font | `font-[Helvetica,Arial,sans-serif]` |
| Primary buttons | `bg-gray-700 rounded-full` |
| CSV buttons | `bg-[#5c7a6a]` (muted sage) |
| Card corners | `rounded-[2rem]` |
| Input corners | `rounded-2xl` |

## Project Structure

```
/src/app
├── page.tsx                    # Create gig form
├── gig/[slug]/page.tsx         # Guest sign-up form
├── success/[slug]/page.tsx     # Success page
├── dashboard/
│   ├── page.tsx                # Dashboard (list/calendar views)
│   └── [slug]/page.tsx         # Gig detail with guest list
└── api/gigs/                   # API routes

/public
└── datcha-logo.png             # Logo

/tests
└── guest-list.spec.ts          # Playwright tests

/prisma
├── schema.prisma               # Database schema
└── dev.db                      # Local SQLite database
```

## License

MIT
