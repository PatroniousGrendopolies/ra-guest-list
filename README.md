# Guest List Sign-Up Middleware

A lightweight web app for nightclub bookers to create gig-specific guest list sign-up forms. DJs receive shareable links, guests enter their name/email/+1s, and bookers export CSVs in Resident Advisor format.

**Live at: https://ra-guest-list.netlify.app**

## Features

- **Gig Creation** - Create guest lists with DJ name, date, venue, and optional guest caps
- **Calendar Import** - Batch import events from Google Calendar (.ics files) with preview and editing
- **Shareable Links** - Each gig gets a unique URL for DJs to share with their guests
- **Guest Sign-up** - Mobile-friendly forms for guests to RSVP with +1s
- **Marketing Consent** - Optional opt-in checkbox for guests to receive event invites (checked by default)
- **Dashboard** - List and calendar views to see all gigs, guest counts, close/reopen lists
- **Gig Editing** - Edit DJ name, adjust capacity, configure max guests per signup
- **Guest Management** - Click any guest row to edit quantity or remove from list
- **CSV Export** - One-click download in Resident Advisor format
- **Export Tracking** - See which guests are new since last export, download only new guests to avoid duplicates
- **Guest Cap Enforcement** - Automatic list closure when capacity is reached
- **Date Conflict Warning** - Confirmation popup when creating gig on date with existing events
- **Secure Login** - Password-protected dashboard with session-based auth

## Pages

- `/` - Create new guest list form
- `/gig/[slug]` - Guest sign-up form (shareable link)
- `/success/[slug]` - Sign-up confirmation page
- `/dashboard` - View all gigs (list or calendar view)
- `/dashboard/[slug]` - Gig detail with guest list table
- `/login` - Admin login

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

### Schema

```prisma
model Gig {
  id             String    @id @default(cuid())
  slug           String    @unique
  date           DateTime
  djName         String
  venueName      String?
  guestCap       Int?
  maxPerSignup   Int       @default(10)
  isClosed       Boolean   @default(false)
  lastExportedAt DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  guests         Guest[]
}

model Guest {
  id               String   @id @default(cuid())
  name             String
  email            String
  quantity         Int      @default(1)
  marketingConsent Boolean  @default(true)
  createdAt        DateTime @default(now())
  gigId            String
  gig              Gig      @relation(fields: [gigId], references: [id], onDelete: Cascade)
}
```

## Deployment

### Current Deployment

| Service | URL |
|---------|-----|
| **Live Site** | https://ra-guest-list.netlify.app |
| **Netlify Admin** | https://app.netlify.com/projects/ra-guest-list |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/iolpzqyxtpzetwevsfnl |

- **Supabase Project Ref**: `iolpzqyxtpzetwevsfnl`
- **Auto-deploy**: Enabled (pushes to `main` trigger deploys)

### Deploy to Netlify + Supabase

#### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > Database**
3. Copy the connection strings:
   - **Connection pooling** URL (for `DATABASE_URL`)
   - **Direct connection** URL (for `DIRECT_URL`)

#### 2. Run Database Migration

```bash
# Set your Supabase URLs
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."

# Push schema to Supabase
npx prisma db push
```

#### 3. Deploy to Netlify

1. Connect your GitHub repo to [Netlify](https://netlify.com)
2. Add environment variables:
   - `DATABASE_URL` - Supabase pooling connection string
   - `DIRECT_URL` - Supabase direct connection string
3. Deploy!

### Environment Variables

```bash
# Supabase PostgreSQL (production)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Email (for password reset - optional)
RESEND_API_KEY="re_..."
```

Get connection strings from the Supabase dashboard: **Connect** button > **ORMs** > **Prisma**

## Supabase MCP (for AI Agents)

This project supports Supabase MCP for AI-assisted database management.

### Configuration

Create `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=iolpzqyxtpzetwevsfnl",
      "headers": {
        "Authorization": "Bearer <YOUR_ACCESS_TOKEN>"
      }
    }
  }
}
```

Get an access token from: https://supabase.com/dashboard/account/tokens

### SQL Migration Reference

To recreate the schema via MCP:

```sql
-- Create Gig table
CREATE TABLE "Gig" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "djName" TEXT NOT NULL,
    "venueName" TEXT,
    "guestCap" INTEGER,
    "maxPerSignup" INTEGER NOT NULL DEFAULT 10,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "lastExportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
);

-- Create Guest table
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gigId" TEXT NOT NULL,
    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- Create unique index on Gig slug
CREATE UNIQUE INDEX "Gig_slug_key" ON "Gig"("slug");

-- Create foreign key from Guest to Gig
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_gigId_fkey"
    FOREIGN KEY ("gigId") REFERENCES "Gig"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
```

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

| Element | Class |
|---------|-------|
| Logo | `width={235} height={79} className="h-[75px] w-auto"` (datcha-logo-black.jpg) |
| Font | `font-[Helvetica,Arial,sans-serif]` |
| Primary buttons | `bg-gray-700 hover:bg-gray-800 rounded-full` |
| CSV/success buttons | `bg-[#5c7a6a] hover:bg-[#4a675a]` (muted sage) |
| Card corners | `rounded-[2rem]` |
| Button shape | `rounded-full` (pill) |
| Input corners | `rounded-2xl` |
| Card hover | `border-2 border-transparent hover:border-gray-300 transition-all duration-150` |
| Trash icon | `text-gray-400 hover:text-gray-600` (no border) |

## Project Structure

```
/src/app
├── page.tsx                    # Create gig form
├── gig/[slug]/page.tsx         # Guest sign-up form
├── success/[slug]/page.tsx     # Success page
├── login/page.tsx              # Admin login
├── dashboard/
│   ├── page.tsx                # Dashboard (list/calendar views)
│   ├── import/page.tsx         # Calendar import wizard
│   └── [slug]/page.tsx         # Gig detail with guest list
└── api/
    ├── gigs/                   # API routes for gig CRUD
    └── guests/[id]/route.ts    # API for guest editing/deletion

/src/lib
└── utils.ts                    # Date formatting utilities

/public
└── datcha-logo-black.jpg       # Logo (black text, 235px width)

/tests
└── guest-list.spec.ts          # Playwright e2e tests

/prisma
├── schema.prisma               # Database schema
└── dev.db                      # Local SQLite database
```

## Troubleshooting

### "Tenant or user not found" Error

This usually means the database password has changed or the project is paused:
1. Check if project is active in Supabase dashboard
2. Reset database password: Project Settings > Database > Reset password
3. Get fresh connection strings from "Connect" button

### MCP Not Loading

1. Ensure `.mcp.json` is in project root
2. Restart Claude Code completely
3. Check access token is valid at https://supabase.com/dashboard/account/tokens

### Migration Failures

If migrations fail, check:
1. The Supabase project is active (not paused)
2. The access token has write permissions
3. No existing tables with conflicting names

To reset and retry:
```sql
DROP TABLE IF EXISTS "Guest";
DROP TABLE IF EXISTS "Gig";
```

## TODO / Pending Setup

- [ ] **Resend API Key** - Set up [Resend](https://resend.com) for password reset emails:
  1. Sign up at https://resend.com (free tier: 3,000 emails/month)
  2. Create an API key
  3. Add `RESEND_API_KEY` to Netlify environment variables (Site settings > Environment variables)

  Without this, the app works fine but the "forgot password" feature won't send emails.

## GitHub Repo

https://github.com/PatroniousGrendopolies/ra-guest-list

## License

MIT
