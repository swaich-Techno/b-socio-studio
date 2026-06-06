# Neon Runtime Notes

The app now uses Neon/Postgres for runtime data through `DATABASE_URL`.

To avoid a risky route-by-route rewrite, the current implementation uses a compatibility table:

```sql
b_socio_records (
  collection text,
  id text,
  data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
```

Each previous model name is stored as a `collection`, and the old document-style fields are stored in `data`. This keeps existing app features working while moving the backend away from MongoDB.

## Required Env

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require
JWT_SECRET=...
ADMIN_EMAIL=harkirat@bsocio.in
```

Use the pooled Neon URL for Vercel runtime.

## Seed Users

Run:

```bash
npm run seed:neon
```

This creates the table if needed and seeds the owner/team logins.

## Future Normalized Migration

The compatibility adapter is the fast production cutover. For advanced reporting, finance dashboards, and larger data volume, the next step is to migrate high-value collections into dedicated relational tables:

1. `users`
2. `clients`
3. `tasks`
4. `leads`
5. `invoices`
6. `calendar_items`
7. `reels`
8. `content_items`

Keep the JSONB adapter during the transition, then move one route group at a time to Prisma or Drizzle queries with proper indexes.

Recommended indexes for the normalized phase:

- `agencyName`
- `clientId`
- `userId`
- `status`
- approval/status dates
- lead `googlePlaceId`

Do not store large uploaded files directly in Postgres. Store files in object storage such as Vercel Blob, S3, or Cloudinary, and keep only metadata/URLs in Neon.
