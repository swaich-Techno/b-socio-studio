# Neon Migration Plan

The current application runtime is MongoDB Atlas through Mongoose. Neon is PostgreSQL, so this is not an environment-variable-only change. The app must move from Mongoose models to a Postgres ORM such as Prisma or Drizzle.

Recommended path: Prisma + Neon pooled connection for Vercel serverless routes.

## 1. Create Neon Project

1. Create a Neon project in the same/nearest region as the Vercel deployment.
2. Copy two connection strings:
   - Pooled app connection: host contains `-pooler`.
   - Direct migration connection: normal Neon host, no `-pooler`.
3. In Vercel, set:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DB?sslmode=require
```

Neon recommends pooled connections for apps with many concurrent/serverless connections. Prisma migrations should use the direct URL.

## 2. Install Postgres ORM Packages

After you are ready to migrate routes, run:

```bash
npm install @prisma/client @neondatabase/serverless @prisma/adapter-neon ws
npm install -D prisma
```

Then add scripts to `package.json`:

```json
{
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:deploy": "prisma migrate deploy",
  "postinstall": "prisma generate"
}
```

## 3. Generate The Neon Schema

A starter schema is included at `prisma/schema.prisma`. It mirrors the current Mongo collections with Postgres-friendly table shapes and keeps arrays/complex nested fields as `Json` where migration speed matters.

Run locally after installing Prisma:

```bash
npx prisma generate
npx prisma migrate dev --name init_neon
```

For production on Vercel:

```bash
npx prisma migrate deploy
```

## 4. Add Prisma Client

Create `lib/prisma.js` only after installing `@prisma/client`:

```js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## 5. Convert API Routes

Replace these patterns everywhere:

- `await connectDB(); Model.find(...).lean()` -> `prisma.model.findMany(...)`
- `Model.create(data)` -> `prisma.model.create({ data })`
- `findOneAndUpdate` -> `updateMany` or `update({ where, data })`
- `ObjectId` references -> string IDs in Prisma
- Mongoose `populate` -> Prisma `include` or a second query
- Mongoose schema defaults -> Prisma defaults or route-level defaults

Priority route order:

1. Auth: `app/api/auth/*`, `lib/auth.js`.
2. Agency scope: users, clients, team, approvals.
3. Money: invoices, packages, financials.
4. Production: tasks, reels, calendar, content.
5. Reporting: analytics, reports, audit logs.
6. Growth: leads, Google Maps discovery.
7. Files: move binary/base64 file data out of database to Vercel Blob/S3/Cloudinary.

## 6. Migrate Data From Mongo

Write a one-time migration script that:

1. Connects to MongoDB with the old `MONGODB_URI`.
2. Connects to Neon with `DATABASE_URL` or `DIRECT_URL`.
3. Migrates users first and stores old Mongo `_id` in `mongoId`.
4. Migrates clients and maps old client IDs to new IDs.
5. Migrates dependent records: invoices, tasks, reels, calendar, content, analytics, reports, chats, files metadata, leads.
6. Verifies counts and critical owner login.
7. Keeps Mongo read-only for rollback until production is verified.

## 7. Vercel Variables After Cutover

Keep:

```env
DATABASE_URL=...
DIRECT_URL=...
JWT_SECRET=...
ADMIN_EMAIL=...
NEXT_PUBLIC_APP_URL=https://studio.bsocio.in
RESEND_API_KEY=...
EMAIL_FROM=...
GOOGLE_MAPS_API_KEY=...
RUNWAY_API_KEY=...
REEL_VIDEO_API_ENDPOINT=...
```

Remove after route conversion is complete:

```env
MONGODB_URI
```

## 8. Performance Notes

- Use Neon pooled connection string for app runtime.
- Keep direct connection for Prisma migrations.
- Add indexes for `agencyName`, `clientId`, `userId`, `status`, dates, and lead `placeId`.
- Do not store uploaded files as base64 in Postgres. Store files in object storage and save URL/metadata in Postgres.
- Keep Google Places data fresh. Store `placeId`, outreach status, notes, and CRM-owned data; refresh Google display fields when needed.
