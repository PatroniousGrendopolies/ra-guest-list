# Guest List Sign-Up Middleware

A lightweight web app for nightclub bookers to create gig-specific guest list sign-up forms. DJs receive shareable links, guests enter their name/email/+1s, and bookers export CSVs in Resident Advisor format.

## Features

- **Gig Creation** - Create guest lists with DJ name, date, venue, and optional guest caps
- **Shareable Links** - Each gig gets a unique URL for DJs to share with their guests
- **Guest Sign-up** - Mobile-friendly forms for guests to RSVP with +1s
- **Dashboard** - View all gigs, guest counts, close/reopen lists
- **CSV Export** - One-click download in Resident Advisor format
- **Guest Cap Enforcement** - Automatic list closure when capacity is reached

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Supabase)
- Playwright (32 e2e tests)

## Local Development

```bash
# Install dependencies
npm install

# Set up local SQLite database
# Edit prisma/schema.prisma: change provider to "sqlite"
# Edit .env: set DATABASE_URL="file:./dev.db"

npx prisma migrate dev

# Run dev server
npm run dev
```

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
npx playwright test
```

## CSV Export Format

Exports match Resident Advisor's expected format:

| Name | Company | Email | Quantity | Type |
|------|---------|-------|----------|------|
| Guest Name | | guest@email.com | 2 | |

## License

MIT
