# Agent Setup Instructions: Supabase Database

These instructions are for an AI agent with access to Supabase MCP tools to set up the database for this project.

## Project Configuration

| Setting | Value |
|---------|-------|
| Project Ref | `iolpzqyxtpzetwevsfnl` |
| Region | `ca-central-1` (Canada - Montreal) |
| Dashboard | https://supabase.com/dashboard/project/iolpzqyxtpzetwevsfnl |

## Prerequisites

- Supabase MCP server connected with valid access token
- MCP configured in `.mcp.json` (see below)
- The project repo cloned locally

### MCP Configuration

The `.mcp.json` file should contain:

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

## Step 1: Create Database Tables

Use the `mcp__supabase__apply_migration` tool to create the schema:

```
Name: create_gig_and_guest_tables
Query:
```

```sql
-- Create Gig table
CREATE TABLE "Gig" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "djName" TEXT NOT NULL,
    "venueName" TEXT,
    "guestCap" INTEGER,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
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

## Step 2: Verify Tables Created

Use `mcp__supabase__list_tables` with schema `["public"]` to confirm both tables exist:
- Gig
- Guest

## Step 3: Get Connection Details

Use `mcp__supabase__get_project_url` to get the project URL.

The user will need to get the database connection strings from the Supabase dashboard:
- Project Settings > Database > Connection string
- Transaction mode (port 6543) → DATABASE_URL
- Session mode (port 5432) → DIRECT_URL

## Step 4: Configure Netlify Environment Variables

The user needs to add these environment variables in Netlify:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres` |

## Step 5: Run Security Advisors (Optional)

After setup, use `mcp__supabase__get_advisors` with type `"security"` to check for any security recommendations.

## Verification

To verify the setup works, use `mcp__supabase__execute_sql` to run:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Expected result should include `Gig` and `Guest` tables.

## Troubleshooting

If migrations fail, check:
1. The Supabase project is active (not paused)
2. The access token has write permissions
3. No existing tables with conflicting names

To reset and retry:
```sql
DROP TABLE IF EXISTS "Guest";
DROP TABLE IF EXISTS "Gig";
```

Then re-run the migration.
