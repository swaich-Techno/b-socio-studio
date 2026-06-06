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

Current Mongo runtime:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/b-socio-studio?retryWrites=true&w=majority
JWT_SECRET=use_a_long_random_secret
ADMIN_EMAIL=owner@example.com
NEXT_PUBLIC_APP_NAME=B Socio Studio
NEXT_PUBLIC_APP_URL=https://studio.bsocio.in
RESEND_API_KEY=
EMAIL_FROM=B Socio Studio <noreply@studio.bsocio.in>
GOOGLE_MAPS_API_KEY=
RUNWAY_API_KEY=
REEL_VIDEO_API_ENDPOINT=
REEL_VIDEO_PROVIDER=runway-compatible
```

Neon target variables after migration:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DB?sslmode=require
```

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
6. Register the first owner account using the same email as `ADMIN_EMAIL`.

## Production Checklist

- Login page opens on the custom domain.
- First owner account is approved automatically.
- `/leads` opens after login.
- Google Maps search returns results when `GOOGLE_MAPS_API_KEY` is set.
- `/reels` opens after login.
- Video job creation shows a provider message when `RUNWAY_API_KEY` and `REEL_VIDEO_API_ENDPOINT` are set.
- Email verification and password reset work after Resend variables are set.
- MongoDB Atlas allows Vercel access until Neon migration is completed.

## Neon Note

This version still runs on MongoDB through Mongoose. The Neon migration scaffold is included in:

```text
docs/NEON_MIGRATION.md
prisma/schema.prisma
```

Finish the Prisma route conversion before removing `MONGODB_URI`.
