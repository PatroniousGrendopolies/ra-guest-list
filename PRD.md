# Guest List Sign-Up Middleware — PRD

### TL;DR

A lightweight web app for nightclub bookers to rapidly create gig-specific guest list sign-up forms—DJs receive links to share, and guests simply enter their name, email, and number of +1s. All submissions are aggregated and exported as CSVs in the Resident Advisor format, with no payment or check-in features—guaranteeing frictionless management for bookers and a seamless experience for guests. Future phases will add secure dashboard login, Google Calendar integration, and a contacts database to track repeat attendees.

---

## Goals

### Business Goals

* Streamline guest list collection for nightly gigs, reducing admin workload by at least 75%.

* Enable bookers to reliably export CSVs compatible with Resident Advisor for every event.

* Maintain attendee caps to prevent over-subscription, minimizing issues at the venue door.

* Deliver a tool with zero onboarding or technical support required.

* Ensure conversion rates (form completion to successful CSV upload) exceed 95%.

### User Goals

* DJs and their guests can sign up in under 60 seconds with no confusion or errors.

* Managers easily see all guest lists and download accurate, ready-to-use CSVs in seconds.

* Immediate feedback to guests if a list is full, so nobody is left unsure.

* Prevent reliance on scattered emails or messy manual tracking.

* Fast, mobile-friendly access—no required downloads or accounts for guests.

### Achieved User Goals

* Bookers can securely access their dashboard with protected login credentials.

### Future User Goals

* Bookers can import events directly from Google Calendar to save time on gig creation.

* Bookers can view contact history to identify loyal attendees and track engagement across events.

### Non-Goals

* Integrating ticket sales, QR code ticketing, or managing check-in at the event.

* Handling payment processing or refunds.

* De-duplicating sign-ups across different gigs or handling Resident Advisor internal duplication.

---

## User Stories

### Personas & Stories

**Booker/Manager**

* As a booker, I want to create a unique sign-up form for each gig with separate DJ assignments, so I can keep guest lists organized per event.

* As a booker, I want to see a dashboard of all upcoming gigs, so I can monitor guest list sizes and readiness.

* As a booker, I want to export a compliant CSV file for Resident Advisor, so handing off lists before the event is frictionless.

* As a booker, I want to set or adjust the guest cap even after creating a list, so I can accommodate late changes.

**DJ**

* As a DJ, I want to receive a single link for my guest list that I can share, so I don’t need to manage emails or track submissions.

* As a DJ, I want the process to be fast for my fans, so more of them sign up without hassle.

**Guest**

* As a guest, I want to enter my name, email, and number of +1s, so I can ensure my friends and I are included.

* As a guest, I want immediate feedback if the list is full, so I’m not left guessing if I’m on the list.

* As a guest, I want to be confident my info is safe and used only for the event.

---

## Functional Requirements

* **Form Generation (Priority: High)**

  * Gig setup: Booker provides gig date, DJ name(s), and optional guest cap.

  * Generates a unique, shareable sign-up link per gig.

* **Sign-up Form (Priority: High)**

  * Guest-facing form fields: Name (required), Email (required), Quantity (+1s, required, min 1, max per cap).

  * Displays gig and DJ info.

  * Form becomes unavailable (disabled) if guest cap is met.

  * Simple confirmation and “list full” feedback.

* **Dashboard (Priority: Medium)**

  * Manager/booker views all gigs (sortable by date and DJ).

  * Displays count of sign-ups (+1s included).

  * Provides single-click CSV export for any gig.

* **CSV Export (Priority: High)**

  * Downloads CSV per gig, formatted for Resident Advisor (“Name”, “Company” blank, “Email”, “Quantity”, “Type” blank).

  * CSV file always matches cap; never more entries than allowed.

* **Admin Controls (Priority: Low)**

  * Manual close for any live guest list.

  * Adjust guest cap before cut-off.

* **Gig Editing (Priority: Medium)**

  * Edit DJ/artist name after creation.

  * Adjust guestlist capacity (cannot go below current guest count).

  * Configure max guests per signup (default: 10).

* **Guest Management (Priority: Medium)**

  * Click on any guest row to edit their entry.

  * Adjust number of guests per signup.

  * Remove individual guests from the list.

  * Admin edits can exceed normal limits.

---

## Completed Features

### Phase 4: Secure Dashboard Login (Completed)

* **Authentication**

  * Secure login required for dashboard and API access (`/dashboard/*`, `/api/gigs/*`, `/api/guests/*`).

  * Session-based authentication with secure password hashing (scrypt).

  * Browser session cookies (logged out when browser closes).

  * Guest sign-up forms remain publicly accessible (no login required for guests).

  * Logout functionality with session invalidation.

  * Password reset flow via email (Resend integration).

  * Single admin user stored in database (`AdminConfig` model).

### Phase 5: Marketing Consent (Completed)

* **Guest Opt-in for Marketing**

  * Optional checkbox on guest signup form for receiving event invites.

  * Checked by default (opt-out model).

  * Label: "Get early access to private lists and exclusive event invites".

  * Stored in `Guest.marketingConsent` Boolean field (default: true).

  * CSV export format unchanged to maintain Resident Advisor compatibility.

---

## Feature Roadmap

For planned features, improvements, and technical debt items, see **[TODOS.md](TODOS.md)**.

---

## User Experience

**Entry Point & First-Time User Experience**

* Booker accesses the dashboard via secure login (email + password authentication).

* After login, booker sees an uncluttered interface with all gigs and option to create new ones.

* Generates a unique link with a single click—no onboarding or tutorials necessary.

* Guest sign-up forms remain publicly accessible (no login required for guests).

**Core Experience**

* **Step 1: Booker**

  * Inputs gig details and generates a DJ/guest list link.

  * Receives link displayed on confirmation screen for copy/paste sharing.

* **Step 2: DJ**

  * Receives link via email/message and distributes to guests/fans.

* **Step 3: Guest**

  * Accesses link (mobile or desktop).

  * Sees clean form: “Event with \[DJ Name\] on \[Date\],” fields for name, email, +1s.

  * App validates required fields in real time; caps quantity to gig max.

  * On submit:

    * Success: Friendly confirmation message, no further action needed.

    * If cap reached: “List is full” message; form disables.

* **Step 4: Booker/Manager**

  * Logs into dashboard with email and password at `/login`.

  * Sees table or list of upcoming gigs, with real-time guest counts.

  * Clicks "Download CSV" for any gig; file downloaded instantly in Resident Advisor format.

  * Can reset password via email link if forgotten.

* **Step 5: Before Event**

  * Booker can adjust cap or close a list (rare, handled on dashboard).

  * Recommended: After event, data auto-deletes for privacy.

**Advanced Features & Edge Cases**

* If sign-up attempted after cap, shows pleasant rejection (“Sorry, guest list is full!”), with no lingering form.

* Bookers can override cap/close forms manually before the event.

* No duplicate email checks—OK for multiple sign-ups from one address.

* Company and Type fields are never asked or displayed to users.

* If a guest reloads after list closes, form is not available.

**UI/UX Highlights**

* Mobile-first, one-column layout with large touch targets.

* Bright color contrast for accessibility; simple headline font.

* CSV export button stands out visually and clearly states its function.

* All inputs are labeled; error states (missing/invalid fields) use friendly, readable copy.

* No unnecessary fields or clutter—laser focus on the 3 critical data points.

* Only active gig forms accept entries—preventing late or mistaken sign-ups.

---

## Narrative

On a busy Friday afternoon, Ella, a nightclub booker, needs to organize the guest lists for five DJs performing that night. In her old workflow, this meant back-and-forth emails, compiling names from texts, and hunting for the right file format. Now, she opens the Guest List Sign-Up Middleware and, in minutes, inputs each gig’s date, DJ, and desired guest cap. Each DJ gets a link—no passwords, no delays. Their followers sign up from their phones with a few taps, providing names, emails, and who’s coming along. As doors approach, Ella simply exports each list as a perfectly formatted CSV, uploading them to Resident Advisor in seconds. No more over-stuffed lists, lost emails, or late-night data wrangling—the DJs are happy, the guests know their status, and Ella finishes her prep with time to spare. The door runs smoothly, fans get in without a hitch, and the whole club breathes easier with a process engineered for speed and reliability.

---

## Success Metrics

### User-Centric Metrics

* Percentage of DJs using links for guest list collection (tracked weekly).

* Conversion rate: ratio of successful sign-ups to opened form links.

* Guest drop-off: form abandon rates before completion.

### Business Metrics

* Reduction in time spent compiling/exporting lists (target: >75% faster).

* Accuracy rate: percentage of CSVs successfully uploaded to Resident Advisor without manual editing.

* Incident rate: number of rejected/over-cap lists per gig (target: <1%).

### Technical Metrics

* Uptime during peak event nights (>99.5% targeted on Friday/Saturday nights).

* Error rate on CSV file generation and downloads (target: <0.1%).

* Response time for form submissions and dashboard actions (<500ms).

### Tracking Plan

* Guest list link views (per gig).

* Form submissions (per gig/link).

* CSV file downloads (per gig).

* Failed or blocked sign-up attempts (post cap).

* Number of unique gig forms created.

* Dashboard visits by role (Booker/Manager).

---

## Technical Considerations

### Technical Needs

* **Frontend:** Responsive web interface for gig creation, sign-up forms, and manager dashboard.

* **Backend:** Minimal API with endpoints for gig CRUD (create, update, delete), guest sign-up creation, and CSV export.

* **CSV Generator:** Server-side or client-side CSV formatter to match Resident Advisor requirements.

### Integration Points

* No direct Resident Advisor integration; only required to match their CSV field order and formatting precisely, with “Company” and “Type” always left blank.

* Hosting on simple PaaS or static host (scoped to webform and API).

### Data Storage & Privacy

* Each gig stores: date, DJ(s), guest cap, and guest list (name, email, quantity).

* No accounts or persistent user data; deletion of sign-up data recommended post-event (timed auto-delete, admin-controlled).

* Compliance with local data privacy laws regarding event-based data retention.

### Scalability & Performance

* Capacity for up to 1,000 sign-ups per gig and up to 50 concurrent live gigs without degradation.

* Robust handling for simultaneous submissions approaching cap (avoid race conditions/over-committing slots).

### Potential Challenges

* Preventing oversubscription when simultaneous sign-ups happen at the cap threshold.

* Ensuring each gig link is unique and difficult to guess (simple obscurity).

* Guarding against automated spam sign-ups (basic throttling).

* Exported CSV always exactly matches allowed column order/field names.

---

## Technical Debt / TODOs

* **Hardcoded Venue Name in OG Meta Tags**: The Open Graph meta tags for gig sign-up links currently hardcode "at Datcha" in the title (e.g., "Sign up to the list for DJ Name tonight at Datcha"). When expanding to other venues:
  - Populate the `venueName` column in the `Gig` table for all gigs
  - Update `/src/app/gig/[slug]/page.tsx` to use `gig.venueName` instead of hardcoded "Datcha"
  - Consider adding a default venue setting in `AdminConfig` for new gigs

* **Resend Email Setup**: Email functionality for password reset requires Resend API key configuration.

---

## Milestones & Sequencing

### Project Estimate

* Small: 1–2 weeks from project start to initial launch.

### Team Size & Composition

* Small Team: 1–2 people total (Product/Engineering focus).

  * One full-stack engineer (works across frontend, backend, and deployment).

  * Optional: Product/design owner for UI/UX polish and requirements.

### Suggested Phases

**Phase 1: Basic Guest List Link Generation & Form (3–4 days)**

* Key Deliverables: Engineer delivers gig creation UI, guest-facing sign-up form, and unique link generator.

* Dependencies: None.

**Phase 2: Dashboard with Export (2–3 days)**

* Key Deliverables: Engineer implements dashboard view with gig list, guest counts, and Resident Advisor CSV export.

* Dependencies: Phase 1 functional.

**Phase 3: UI Polish & Edge Handling (1–2 days)**

* Key Deliverables: Engineer/Product refine mobile UX, add form/edge-case handling for full lists, and ensure accessibility.

* Dependencies: Phase 2 operational.

---