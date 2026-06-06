# B Socio Studio

**Be Seen. Be Social.**

B Socio Studio is a private agency operating system for clients, leads, approvals, content, reels, tasks, team management, analytics, reports, billing notes, and internal collaboration.

Production domain:

```text
https://studio.bsocio.in
```

This app is not a public SaaS. Only the owner/admin and approved team members should use it.

## Tech Stack

- Next.js App Router
- JavaScript
- Tailwind CSS
- Neon/Postgres runtime through `@neondatabase/serverless`
- Email/password auth with `bcryptjs`
- JWT session cookie auth
- Vercel deployment

## Main Features

- Private login/register flow with owner approval
- Harkirat Singh owner/admin seed login
- Approved team logins for Aman Swaich and Lovejot
- Owner/Admin permissions for approvals, team management, client management, billing, task assignment, calendar, reports, and audit visibility
- Inbuilt team member creation from `/team`
- Pending, rejected, and suspended user blocking
- Owner/Admin audit logs for sensitive actions
- Internal notifications for approvals, tasks, and reminders
- Role and permission based access
- Team management with skills, permissions, assigned clients, and availability
- Internal team chat and client/topic chat channels
- Google Maps lead discovery with scoring, outreach status, and convert-to-client flow
- Client pipeline and package/billing fields
- Invoice maker with print/save PDF view and WhatsApp/email share links
- Catalogue/menu builder for client products, services, and price lists
- Content generator for captions, hashtags, ideas, reels, stories, ads, WhatsApp messages, and review requests
- Reel script studio plus video-provider job adapter for evergreen reel creation
- Reels production board for scripting, shooting, editing, review, approvals, and posted status
- Content calendar with approval workflow
- Agency tasks and assignment controls
- Manual analytics tracker with charts
- Weekly/monthly style client report generator
- Financials overview for balances, invoices, packages, and revenue tracking
- Mobile-friendly sidebar and bottom navigation

## Required Environment Variables

Create `.env.local` locally:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_EMAIL=harkirat@bsocio.in
NEXT_PUBLIC_APP_NAME=B Socio Studio
NEXT_PUBLIC_APP_URL=http://localhost:3000

SEED_AGENCY_NAME=B Socio Studio
SEED_OWNER_EMAIL=harkirat@bsocio.in
SEED_AMAN_EMAIL=aman@bsocio.in
SEED_LOVEJOT_EMAIL=lovejot@bsocio.in
SEED_OWNER_PASSWORD=
SEED_TEAM_PASSWORD=

RESEND_API_KEY=
EMAIL_FROM=B Socio Studio <noreply@studio.bsocio.in>
GOOGLE_MAPS_API_KEY=
RUNWAY_API_KEY=
REEL_VIDEO_API_ENDPOINT=
REEL_VIDEO_PROVIDER=runway-compatible
OPENAI_API_KEY=
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=
```

For production on Vercel:

```env
NEXT_PUBLIC_APP_URL=https://studio.bsocio.in
```

`ADMIN_EMAIL` should match Harkirat's owner email. The seeded owner account is approved automatically.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example:

```bash
copy .env.example .env.local
```

3. Add the Neon pooled `DATABASE_URL`, `JWT_SECRET`, and app URL.

4. Seed the owner and team logins:

```bash
npm run seed:neon
```

If `SEED_OWNER_PASSWORD` and `SEED_TEAM_PASSWORD` are blank, the script generates strong one-time passwords and prints them.

5. Run the app:

```bash
npm run dev
```

6. Open:

```text
http://localhost:3000
```

## Seeded Logins

- Harkirat Singh: `harkirat@bsocio.in`, role `Owner/Admin`
- Aman Swaich: `aman@bsocio.in`, role `Designer`
- Lovejot: `lovejot@bsocio.in`, role `Reel Editor`

The seed script prints the actual passwords used. If you want fixed private passwords, set `SEED_OWNER_PASSWORD` and `SEED_TEAM_PASSWORD` in `.env.local` before running the seed.

## Neon Runtime

Runtime data is stored in Neon/Postgres in the `b_socio_records` JSONB table. This keeps the app fast to deploy and removes MongoDB from production env.

The next advanced phase is to normalize high-value records such as users, clients, leads, invoices, and tasks into dedicated relational tables for deeper analytics and financial reporting. See:

```text
docs/NEON_MIGRATION.md
```

## GitHub Upload

Commit these project files:

```text
app/
components/
docs/
lib/
models/
prisma/
public/
scripts/
.env.example
.gitignore
eslint.config.mjs
jsconfig.json
next.config.js
package.json
package-lock.json
postcss.config.js
proxy.js
tailwind.config.js
README.md
```

Do not upload:

```text
.env
.env.local
.next/
node_modules/
.vercel/
```

For new independent repository deployment, follow:

```text
docs/DEPLOY_NEW_REPO.md
```

## Vercel Deployment

1. Import the GitHub repository in Vercel.
2. Framework preset: `Next.js`.
3. Root directory: project root.
4. Build command: `npm run build`.
5. Output directory: leave blank/default.
6. Add all environment variables in Project Settings.
7. Deploy.
8. Add custom domain:

```text
studio.bsocio.in
```

9. Set `NEXT_PUBLIC_APP_URL=https://studio.bsocio.in` and redeploy.

## Approval Flow

- Harkirat can approve users, content, calendar items, reels, and client approvals.
- Harkirat can create, edit, suspend, approve, and remove team members.
- Harkirat can assign tasks to team members.
- Team members can update assigned work but cannot permanently delete core data.
- API routes check approval and permissions on the server.

## Production Checklist

- `DATABASE_URL` uses the Neon pooled connection string.
- `JWT_SECRET` is long and private.
- `ADMIN_EMAIL=harkirat@bsocio.in` unless you changed the seed owner email.
- `NEXT_PUBLIC_APP_URL=https://studio.bsocio.in`.
- `npm run seed:neon` has been run against production Neon.
- Harkirat can log in and open `/team`, `/tasks`, `/approvals`, `/leads`, and `/reels`.
- Google Maps lead generation works after `GOOGLE_MAPS_API_KEY` is set.
- Reel video job creation works after the video provider variables are set.
