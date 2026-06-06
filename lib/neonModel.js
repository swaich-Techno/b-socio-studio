import { randomUUID } from "crypto";
import { ensureDatabase } from "@/lib/neon";

const REF_COLLECTIONS = {
  assignedAdsManager: "User",
  assignedClients: "Client",
  assignedCoordinator: "User",
  assignedDesigner: "User",
  assignedPhotographer: "User",
  assignedReelEditor: "User",
  assignedTeamMembers: "User",
  clientId: "Client",
  createdBy: "User",
  fileId: "FileAsset",
  packageId: "Package",
  senderId: "User",
  userId: "User"
};

function nowIso() {
  return new Date().toISOString();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof RegExp);
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function toId(value) {
  if (value === null || value === undefined) return value;
  if (isPlainObject(value) && value._id !== undefined) return toId(value._id);
  return String(value);
}

function normalizeRecord(data) {
  const doc = clone(data) || {};
  const id = toId(doc._id || doc.id || randomUUID());
  doc._id = id;
  doc.id = id;
  if (!doc.createdAt) doc.createdAt = nowIso();
  if (!doc.updatedAt) doc.updatedAt = doc.createdAt;
  return doc;
}

function isReferenceField(key) {
  return Boolean(REF_COLLECTIONS[key]) || key.endsWith("Id");
}

function depopulateField(key, value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((item) => depopulateField(key, item)).filter((item) => item !== undefined);
  if (isReferenceField(key) && isPlainObject(value) && value._id !== undefined) return toId(value._id);
  if (value instanceof Date) return value.toISOString();
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .map(([childKey, childValue]) => [childKey, depopulateField(childKey, childValue)])
      .filter(([, childValue]) => childValue !== undefined)
  );
}

function documentToPlain(document) {
  const plain = {};
  for (const [key, value] of Object.entries(document)) {
    if (key.startsWith("__") || value === undefined) continue;
    plain[key] = depopulateField(key, value);
  }
  return normalizeRecord(plain);
}

async function allRecords(collection) {
  const sql = await ensureDatabase();
  const rows = await sql`SELECT id, data FROM b_socio_records WHERE collection = ${collection}`;
  return rows.map((row) => normalizeRecord({ ...(row.data || {}), _id: row.id }));
}

async function recordById(collection, id) {
  if (id === null || id === undefined) return null;
  const sql = await ensureDatabase();
  const rows = await sql`SELECT id, data FROM b_socio_records WHERE collection = ${collection} AND id = ${toId(id)} LIMIT 1`;
  if (!rows.length) return null;
  return normalizeRecord({ ...(rows[0].data || {}), _id: rows[0].id });
}

async function upsertRecord(collection, data) {
  const sql = await ensureDatabase();
  const doc = normalizeRecord(data);
  doc.updatedAt = nowIso();
  await sql`
    INSERT INTO b_socio_records (collection, id, data, created_at, updated_at)
    VALUES (${collection}, ${doc._id}, ${JSON.stringify(doc)}::jsonb, COALESCE(${doc.createdAt}::timestamptz, now()), now())
    ON CONFLICT (collection, id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  return doc;
}

async function deleteRecord(collection, id) {
  const existing = await recordById(collection, id);
  if (!existing) return null;
  const sql = await ensureDatabase();
  await sql`DELETE FROM b_socio_records WHERE collection = ${collection} AND id = ${toId(id)}`;
  return existing;
}

function comparable(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed) && /^\d{4}-\d{2}-\d{2}/.test(value)) return parsed;
  }
  return value;
}

function equalValue(left, right) {
  const normalizedLeft = toId(left);
  const normalizedRight = toId(right);
  return normalizedLeft === normalizedRight;
}

function pathValues(source, path) {
  const parts = String(path).split(".");
  let values = [source];
  for (const part of parts) {
    values = values.flatMap((value) => {
      if (Array.isArray(value)) return value.map((item) => item?.[part]);
      if (value === null || value === undefined) return [undefined];
      return [value[part]];
    });
  }
  return values.flatMap((value) => (Array.isArray(value) ? value : [value]));
}

function matchesOperator(values, operator, expected) {
  if (operator === "$exists") {
    const exists = values.some((value) => value !== undefined);
    return Boolean(expected) ? exists : !exists;
  }
  if (operator === "$in") {
    const list = Array.isArray(expected) ? expected.map(toId) : [toId(expected)];
    return values.some((value) => Array.isArray(value)
      ? value.map(toId).some((item) => list.includes(item))
      : list.includes(toId(value)));
  }
  if (operator === "$nin") {
    const list = Array.isArray(expected) ? expected.map(toId) : [toId(expected)];
    return values.every((value) => !list.includes(toId(value)));
  }
  if (operator === "$ne") {
    return values.every((value) => !equalValue(value, expected));
  }
  if (operator === "$gte") {
    return values.some((value) => comparable(value) >= comparable(expected));
  }
  if (operator === "$lte") {
    return values.some((value) => comparable(value) <= comparable(expected));
  }
  if (operator === "$gt") {
    return values.some((value) => comparable(value) > comparable(expected));
  }
  if (operator === "$lt") {
    return values.some((value) => comparable(value) < comparable(expected));
  }
  return false;
}

function matchesField(value, expected) {
  const values = Array.isArray(value) ? value : [value];
  if (expected instanceof RegExp) {
    return values.some((item) => expected.test(String(item || "")));
  }
  if (isPlainObject(expected)) {
    const operators = Object.keys(expected).filter((key) => key.startsWith("$"));
    if (operators.length) {
      return operators.every((operator) => matchesOperator(values, operator, expected[operator]));
    }
  }
  return values.some((item) => {
    if (Array.isArray(item)) return item.some((child) => equalValue(child, expected));
    return equalValue(item, expected);
  });
}

function matchesQuery(doc, query = {}) {
  return Object.entries(query || {}).every(([key, expected]) => {
    if (key === "$or") return (expected || []).some((childQuery) => matchesQuery(doc, childQuery));
    if (key === "$and") return (expected || []).every((childQuery) => matchesQuery(doc, childQuery));
    return matchesField(pathValues(doc, key), expected);
  });
}

function literalFieldsFromQuery(query = {}) {
  const fields = {};
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    if (isPlainObject(value) && Object.keys(value).some((operator) => operator.startsWith("$"))) continue;
    fields[key] = depopulateField(key, value);
  }
  return fields;
}

function setPath(source, path, value) {
  const parts = String(path).split(".");
  let cursor = source;
  parts.slice(0, -1).forEach((part) => {
    if (!isPlainObject(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  });
  const finalKey = parts[parts.length - 1];
  const cleaned = depopulateField(finalKey, value);
  if (cleaned !== undefined) cursor[finalKey] = cleaned;
}

function applyUpdate(doc, update = {}) {
  const next = normalizeRecord({ ...doc });
  const hasOperators = Object.keys(update).some((key) => key.startsWith("$"));
  if (!hasOperators) {
    for (const [key, value] of Object.entries(update)) {
      if (value !== undefined) setPath(next, key, value);
    }
    return normalizeRecord(next);
  }

  for (const [key, value] of Object.entries(update.$set || {})) {
    setPath(next, key, value);
  }
  for (const [key, value] of Object.entries(update.$setOnInsert || {})) {
    if (next[key] === undefined) setPath(next, key, value);
  }
  for (const [key, value] of Object.entries(update.$addToSet || {})) {
    const current = pathValues(next, key)[0];
    const values = Array.isArray(current) ? current.slice() : [];
    const item = depopulateField(key, value?.$each ? value.$each : value);
    const additions = Array.isArray(item) ? item : [item];
    additions.forEach((addition) => {
      if (!values.some((existing) => equalValue(existing, addition))) values.push(addition);
    });
    setPath(next, key, values);
  }
  for (const [key, value] of Object.entries(update.$pull || {})) {
    const current = pathValues(next, key)[0];
    const values = Array.isArray(current) ? current.filter((item) => !equalValue(item, value)) : [];
    setPath(next, key, values);
  }

  return normalizeRecord(next);
}

function sortRecords(records, sortSpec) {
  if (!sortSpec || !Object.keys(sortSpec).length) return records;
  return records.slice().sort((left, right) => {
    for (const [field, direction] of Object.entries(sortSpec)) {
      const leftValue = comparable(pathValues(left, field)[0]);
      const rightValue = comparable(pathValues(right, field)[0]);
      if (leftValue === rightValue) continue;
      if (leftValue === undefined || leftValue === null) return 1;
      if (rightValue === undefined || rightValue === null) return -1;
      return leftValue > rightValue ? direction : -direction;
    }
    return 0;
  });
}

function selectRecord(doc, selectSpec) {
  if (!doc || !selectSpec) return doc;
  if (typeof selectSpec !== "string") return doc;
  const fields = selectSpec.split(/\s+/).filter(Boolean);
  const excluding = fields.every((field) => field.startsWith("-"));
  const next = {};

  if (excluding) {
    Object.assign(next, doc);
    fields.forEach((field) => {
      delete next[field.slice(1)];
    });
    return next;
  }

  fields.forEach((field) => {
    if (field.startsWith("-")) return;
    if (doc[field] !== undefined) next[field] = doc[field];
  });
  if (doc._id !== undefined && !fields.includes("-_id")) next._id = doc._id;
  if (doc.id !== undefined) next.id = doc.id;
  return next;
}

function collectionForPath(path) {
  const normalized = String(path).split(".").pop();
  return REF_COLLECTIONS[normalized] || (normalized?.endsWith("Id") ? normalized.replace(/Id$/, "") : null);
}

async function populateRecord(doc, populateSpec) {
  if (!doc || !populateSpec?.length) return doc;
  const next = clone(doc);
  for (const spec of populateSpec) {
    const paths = String(spec.path || "").split(/\s+/).filter(Boolean);
    for (const path of paths) {
      const collection = collectionForPath(path);
      if (!collection) continue;
      const current = next[path];
      if (Array.isArray(current)) {
        const populated = await Promise.all(current.map((id) => recordById(collection, id)));
        next[path] = populated.filter(Boolean).map((item) => selectRecord(item, spec.select));
      } else if (current) {
        const populated = await recordById(collection, current);
        next[path] = populated ? selectRecord(populated, spec.select) : current;
      }
    }
  }
  return next;
}

class NeonDocument {
  constructor(collection, data) {
    Object.assign(this, normalizeRecord(data));
    Object.defineProperty(this, "__collection", {
      value: collection,
      enumerable: false,
      configurable: false,
      writable: false
    });
  }

  async save() {
    const existing = await recordById(this.__collection, this._id);
    const merged = normalizeRecord({
      ...(existing || {}),
      ...documentToPlain(this),
      _id: toId(this._id),
      createdAt: existing?.createdAt || this.createdAt || nowIso()
    });
    const saved = await upsertRecord(this.__collection, merged);
    for (const key of Object.keys(this)) delete this[key];
    Object.assign(this, saved);
    return this;
  }

  toObject() {
    return documentToPlain(this);
  }

  toJSON() {
    return this.toObject();
  }
}

class NeonQuery {
  constructor(collection, executor, many = false) {
    this.collection = collection;
    this.executor = executor;
    this.many = many;
    this.selectSpec = "";
    this.populateSpec = [];
    this.sortSpec = null;
    this.limitCount = null;
    this.leanMode = false;
  }

  select(spec) {
    this.selectSpec = spec;
    return this;
  }

  populate(path, select) {
    this.populateSpec.push({ path, select });
    return this;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  limit(count) {
    this.limitCount = Number(count);
    return this;
  }

  lean() {
    this.leanMode = true;
    return this;
  }

  async exec() {
    const raw = await this.executor();
    if (this.many) {
      let records = Array.isArray(raw) ? raw.map(normalizeRecord) : [];
      records = sortRecords(records, this.sortSpec);
      if (Number.isFinite(this.limitCount)) records = records.slice(0, this.limitCount);
      records = await Promise.all(records.map((record) => populateRecord(record, this.populateSpec)));
      records = records.map((record) => selectRecord(record, this.selectSpec));
      return this.leanMode ? records.map(clone) : records.map((record) => new NeonDocument(this.collection, record));
    }

    let record = raw ? normalizeRecord(raw) : null;
    record = await populateRecord(record, this.populateSpec);
    record = selectRecord(record, this.selectSpec);
    return this.leanMode || !record ? clone(record) : new NeonDocument(this.collection, record);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }

  finally(onFinally) {
    return this.exec().finally(onFinally);
  }
}

export function createNeonModel(collection) {
  return class NeonModel {
    static async create(data) {
      if (Array.isArray(data)) {
        return Promise.all(data.map((item) => this.create(item)));
      }
      const saved = await upsertRecord(collection, normalizeRecord(data));
      return new NeonDocument(collection, saved);
    }

    static find(query = {}) {
      return new NeonQuery(collection, async () => {
        const records = await allRecords(collection);
        return records.filter((record) => matchesQuery(record, query));
      }, true);
    }

    static findOne(query = {}) {
      return new NeonQuery(collection, async () => {
        const records = await allRecords(collection);
        return records.find((record) => matchesQuery(record, query)) || null;
      });
    }

    static findById(id) {
      return new NeonQuery(collection, () => recordById(collection, id));
    }

    static countDocuments(query = {}) {
      return (async () => {
        const records = await allRecords(collection);
        return records.filter((record) => matchesQuery(record, query)).length;
      })();
    }

    static findOneAndUpdate(query = {}, update = {}, options = {}) {
      return new NeonQuery(collection, async () => {
        const records = await allRecords(collection);
        const existing = records.find((record) => matchesQuery(record, query));
        if (!existing && !options.upsert) return null;
        const base = existing || normalizeRecord(literalFieldsFromQuery(query));
        const saved = await upsertRecord(collection, applyUpdate(base, update));
        return options.new === false ? existing : saved;
      });
    }

    static findByIdAndUpdate(id, update = {}, options = {}) {
      return this.findOneAndUpdate({ _id: toId(id) }, update, options);
    }

    static findOneAndDelete(query = {}) {
      return new NeonQuery(collection, async () => {
        const records = await allRecords(collection);
        const existing = records.find((record) => matchesQuery(record, query));
        if (!existing) return null;
        return deleteRecord(collection, existing._id);
      });
    }

    static findByIdAndDelete(id) {
      return this.findOneAndDelete({ _id: toId(id) });
    }

    static async updateMany(query = {}, update = {}) {
      const records = await allRecords(collection);
      const matches = records.filter((record) => matchesQuery(record, query));
      await Promise.all(matches.map((record) => upsertRecord(collection, applyUpdate(record, update))));
      return { acknowledged: true, matchedCount: matches.length, modifiedCount: matches.length };
    }

    static async deleteMany(query = {}) {
      const records = await allRecords(collection);
      const matches = records.filter((record) => matchesQuery(record, query));
      await Promise.all(matches.map((record) => deleteRecord(collection, record._id)));
      return { acknowledged: true, deletedCount: matches.length };
    }
  };
}
