# Feature Roadmap & TODOs

This document tracks planned features and improvements for the Guest List Sign-Up Middleware.

## Future User Stories

- As a booker, I want to import events from my Google Calendar, so I can quickly create guest lists for scheduled gigs without manual data entry.

- As a booker, I want to view a contacts page showing all past attendees, so I can see who my repeat guests are and which DJs they follow.

- As a booker, I want to see how many gigs each contact has attended, so I can identify my most loyal guests.

- As a DJ, I want my own dashboard to review, edit, and approve my guest list before the event.

- As a DJ, I want to invite past attendees to my upcoming events so I can build a loyal following.

- As a manager, I want to add guest types (VIP, industry, etc.) that are visible only to staff.

---

## Data Quality & Validation

- [ ] **Duplicate Export Prevention** - Same guest won't be exported twice for the same event

- [x] **Email Uniqueness Enforcement** - Same email can't sign up twice for the same gig (case-insensitive)

---

## Sign-up Analytics

- [ ] **Sign-up Timestamps** - Store and display sign-up time for guests

- [ ] **Sortable Guest List** - Sort by sign-up time

- [ ] **Sign-up Time Visualization** - Line chart showing sign-up distribution over time

---

## Form UX Improvements

- [ ] **Dropdown Increments** - Dropdowns with preset increments for list creation (capacity, max per signup)

---

## Calendar & Import

- [ ] **Google Calendar OAuth** - OAuth integration with Google Calendar API for direct event import

- [ ] **AI Calendar Import** - Parse calendars from text and images (not just .ics files)

---

## Contact Management

- [ ] **Contacts Page** - Aggregate view of all unique attendees across gigs with attendance history, sortable and searchable

- [ ] **Mailing List / CRM** - Contact management with export functionality

- [ ] **SMS Support** - SMS notifications for guests/DJs

---

## DJ Portal

- [ ] **DJ Dashboard** - Dedicated portal for DJs to manage their lists
  - Review, edit, and approve guest list
  - Mobile-friendly share button for bulk invites
  - Generate distinct links per invited contact (prevents link reuse)

- [ ] **DJ Past Attendee Invites** - DJs can invite guests who attended their previous events

---

## Manager Features

- [ ] **Types Column** - Hidden from guests, visible/editable by managers and DJs (default blank)

- [ ] **RA Analytics Shortcuts** - Quick buttons linking to Resident Advisor event analytics

---

## Platform & Branding

- [ ] **Rebrand to Nightlist**
  - New URL structure: `www.datcha.nightlist.com/dashboard`
  - "Powered by Nightlist" beneath venue logo
  - Multi-tenant architecture for multiple venues

---

## Operations & Check-in

- [ ] **Native Scanner** - Built-in QR/ticket scanner for door check-in

- [ ] **API Push to RA** - Direct API integration to push guest lists to Resident Advisor

---

## Advanced Integrations

- [ ] **POS Integration** - Connect to point-of-sale for bar sales analytics per list attendee

---

## Testing & Development

- [ ] **Test Authentication** - Set up test credentials and login flow for Playwright tests
  - Create test user seeding script
  - Add login helper to test suite
  - Ensure tests can run in CI without manual setup

---

## Technical Debt

- [ ] **Hardcoded Venue Name in OG Meta Tags**: The Open Graph meta tags for gig sign-up links currently hardcode "at Datcha" in the title (e.g., "Sign up to the list for DJ Name tonight at Datcha"). When expanding to other venues:
  - Populate the `venueName` column in the `Gig` table for all gigs
  - Update `/src/app/gig/[slug]/page.tsx` to use `gig.venueName` instead of hardcoded "Datcha"
  - Consider adding a default venue setting in `AdminConfig` for new gigs

- [ ] **Resend Email Setup**: Email functionality for password reset requires Resend API key configuration.

- [ ] **Migration System Fix**: Current migrations have SQLite/PostgreSQL mismatch. Need to:
  - Clean up migration history
  - Standardize on PostgreSQL migrations
  - Consider using Supabase migrations instead of Prisma migrate

---

## Recently Completed

- [x] **Marketing Consent Checkbox** (2026-01-26)
  - Added opt-out checkbox to guest signup form
  - Label: "Get early access to private lists and exclusive event invites"
  - Defaults to checked (opt-out model)
  - Stored in `Guest.marketingConsent` field
  - CSV export format unchanged (maintains RA compatibility)
