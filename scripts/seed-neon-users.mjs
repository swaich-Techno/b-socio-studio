import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

function loadEnvFile(filename) {
  if (!existsSync(filename)) return;
  const lines = readFileSync(filename, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const permissionKeys = [
  "create_content",
  "approve_posts",
  "manage_clients",
  "manage_team",
  "manage_billing",
  "manage_ads",
  "view_analytics",
  "view_reports",
  "assign_tasks",
  "manage_calendar"
];

const roleDefaultPermissions = {
  "Owner/Admin": permissionKeys,
  Designer: ["create_content"],
  "Reel Editor": ["create_content"]
};

function generatedPassword() {
  return `B-${randomBytes(12).toString("base64url")}`;
}

const ownerPassword = process.env.SEED_OWNER_PASSWORD || generatedPassword();
const teamPassword = process.env.SEED_TEAM_PASSWORD || generatedPassword();

const users = [
  {
    name: "Harkirat Singh",
    email: process.env.SEED_OWNER_EMAIL || "harkirat@bsocio.in",
    password: ownerPassword,
    role: "Owner/Admin",
    phone: process.env.SEED_OWNER_PHONE || "",
    skills: ["Strategy", "Sales", "Reporting", "Lead Tracking"]
  },
  {
    name: "Aman Swaich",
    email: process.env.SEED_AMAN_EMAIL || "aman@bsocio.in",
    password: teamPassword,
    role: "Designer",
    phone: process.env.SEED_AMAN_PHONE || "",
    skills: ["Canva Design", "Poster Design", "Instagram Posting"]
  },
  {
    name: "Lovejot",
    email: process.env.SEED_LOVEJOT_EMAIL || "lovejot@bsocio.in",
    password: teamPassword,
    role: "Reel Editor",
    phone: process.env.SEED_LOVEJOT_PHONE || "",
    skills: ["Reel Editing", "CapCut Editing", "Mobile Shooting"]
  }
];

function databaseUrl() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("Set DATABASE_URL to your Neon connection string before running this seed.");
  return url;
}

function permissionsForRole(role) {
  const allowed = roleDefaultPermissions[role] || [];
  return Object.fromEntries(permissionKeys.map((key) => [key, allowed.includes(key)]));
}

async function ensureDatabase(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS b_socio_records (
      collection text NOT NULL,
      id text NOT NULL,
      data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (collection, id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS b_socio_records_collection_idx ON b_socio_records (collection)`;
  await sql`CREATE INDEX IF NOT EXISTS b_socio_records_data_gin_idx ON b_socio_records USING gin (data)`;
}

async function findUserByEmail(sql, email) {
  const rows = await sql`
    SELECT id, data
    FROM b_socio_records
    WHERE collection = 'User' AND lower(data->>'email') = lower(${email})
    LIMIT 1
  `;
  return rows[0] || null;
}

async function upsertUser(sql, user) {
  const existing = await findUserByEmail(sql, user.email);
  const id = existing?.id || randomUUID();
  const createdAt = existing?.data?.createdAt || new Date().toISOString();
  const password = await bcrypt.hash(user.password, 12);
  const data = {
    ...(existing?.data || {}),
    _id: id,
    id,
    name: user.name,
    email: user.email.toLowerCase(),
    password,
    agencyName: process.env.SEED_AGENCY_NAME || "B Socio Studio",
    role: user.role,
    status: "approved",
    emailVerified: true,
    permissions: permissionsForRole(user.role),
    skills: user.skills,
    assignedClients: existing?.data?.assignedClients || [],
    chatStatus: existing?.data?.chatStatus || "Available",
    phone: user.phone,
    ownerName: user.role === "Owner/Admin" ? user.name : existing?.data?.ownerName || "",
    defaultCurrency: "INR",
    defaultLanguage: "English",
    createdAt,
    updatedAt: new Date().toISOString()
  };

  await sql`
    INSERT INTO b_socio_records (collection, id, data)
    VALUES ('User', ${id}, ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (collection, id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;

  return { ...data, seededPassword: user.password };
}

const sql = neon(databaseUrl());
await ensureDatabase(sql);
const seeded = [];

for (const user of users) {
  seeded.push(await upsertUser(sql, user));
}

console.log("Seeded Neon users:");
for (const user of seeded) {
  console.log(`${user.name} | ${user.email} | ${user.role} | password: ${user.seededPassword}`);
}
