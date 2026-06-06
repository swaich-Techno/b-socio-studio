# Deploy As A Separate Repo

Use this app as an independent project. Do not mix it with NSS or any other checkout.

## Recommended Repo

```text
studio-b-socio
```

## Upload

Upload the clean folder:

```text
D:\Codex\studio-b-socio-upload
```

or this ZIP:

```text
D:\Codex\studio-b-socio-upload.zip
```

Do not upload:

```text
node_modules
.next
.env.local
.vercel
```

## Vercel Project

1. Create a new GitHub repository.
2. Push this app into that repository.
3. Import that repository into Vercel as a new project.
4. Framework: `Next.js`.
5. Build command: `npm run build`.
6. Output directory: leave blank.
7. Add production environment variables.

## Required Production Env

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require
JWT_SECRET=use_a_long_random_secret
ADMIN_EMAIL=harkirat@bsocio.in
NEXT_PUBLIC_APP_NAME=B Socio Studio
NEXT_PUBLIC_APP_URL=https://studio.bsocio.in
RESEND_API_KEY=
EMAIL_FROM=B Socio Studio <noreply@studio.bsocio.in>
GOOGLE_MAPS_API_KEY=
RUNWAY_API_KEY=
REEL_VIDEO_API_ENDPOINT=
REEL_VIDEO_PROVIDER=runway-compatible
```

## Seed Owner And Team

After adding `DATABASE_URL`, run this once locally or from a trusted deployment shell:

```bash
npm run seed:neon
```

The seed creates:

- `harkirat@bsocio.in` as `Owner/Admin`
- `aman@bsocio.in` as `Designer`
- `lovejot@bsocio.in` as `Reel Editor`

Optional seed variables:

```env
SEED_OWNER_EMAIL=harkirat@bsocio.in
SEED_AMAN_EMAIL=aman@bsocio.in
SEED_LOVEJOT_EMAIL=lovejot@bsocio.in
SEED_OWNER_PASSWORD=
SEED_TEAM_PASSWORD=
```

If password variables are blank, the seed script generates strong one-time passwords and prints them.

## Domain

After the first successful Vercel deployment:

1. Open Vercel project settings.
2. Add the custom domain or subdomain, for example:

```text
studio.bsocio.in
```

3. Add the DNS record Vercel gives you.
4. Set:

```env
NEXT_PUBLIC_APP_URL=https://studio.bsocio.in
```

5. Redeploy.

## Production Checklist

- Login page opens on the custom domain.
- Harkirat can log in and is shown as `Owner/Admin`.
- Harkirat can approve users/content and assign tasks.
- Harkirat can add new team members from `/team`.
- `/leads` opens after login.
- Google Maps search returns results when `GOOGLE_MAPS_API_KEY` is set.
- `/reels` opens after login.
- Video job creation shows a provider message when video provider env is set.
- Email verification and password reset work after Resend variables are set.
