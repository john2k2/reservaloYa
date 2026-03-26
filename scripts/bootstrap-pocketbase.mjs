import fs from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import PocketBase from "pocketbase";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env.local");

async function loadEnvFile() {
  try {
    const content = await fs.readFile(envPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore missing .env.local
  }
}

function baseField(name, type, options = {}) {
  return {
    name,
    type,
    required: false,
    system: false,
    hidden: false,
    presentable: false,
    ...options,
  };
}

function textField(name, options = {}) {
  return baseField(name, "text", options);
}

function boolField(name, options = {}) {
  return baseField(name, "bool", options);
}

function numberField(name, options = {}) {
  return baseField(name, "number", options);
}

function relationField(name, collectionId, options = {}) {
  return baseField(name, "relation", {
    collectionId,
    maxSelect: 1,
    minSelect: 0,
    cascadeDelete: false,
    ...options,
  });
}

function selectField(name, values, options = {}) {
  return baseField(name, "select", {
    maxSelect: 1,
    values,
    ...options,
  });
}

function buildPublicAppActiveBusinessRule() {
  return "@request.auth.id != '' && @request.auth.role = 'public_app' && active = true";
}

function buildPublicAppActiveRelatedBusinessRule() {
  return "@request.auth.id != '' && @request.auth.role = 'public_app' && business.active = true";
}

function buildAdminOnlyRule() {
  return "";
}

function repairBaseCollectionTimestamps() {
  const dbPath = path.join(rootDir, "pocketbase", "pb_data", "data.db");
  const db = new DatabaseSync(dbPath);
  const collectionNames = [
    "businesses",
    "services",
    "availability_rules",
    "blocked_slots",
    "customers",
    "bookings",
    "analytics_events",
    "communication_events",
    "rate_limit_events",
    "booking_locks",
  ];

  try {
    for (const collectionName of collectionNames) {
      const columns = db
        .prepare(`PRAGMA table_info(${JSON.stringify(collectionName)})`)
        .all()
        .map((column) => String(column.name));

      if (!columns.includes("created")) {
        db.exec(
          `ALTER TABLE "${collectionName}" ADD COLUMN "created" TEXT DEFAULT '' NOT NULL`
        );
        db.exec(
          `UPDATE "${collectionName}" SET "created" = strftime('%Y-%m-%d %H:%M:%fZ') WHERE "created" = ''`
        );
      }

      if (!columns.includes("updated")) {
        db.exec(
          `ALTER TABLE "${collectionName}" ADD COLUMN "updated" TEXT DEFAULT '' NOT NULL`
        );
        db.exec(
          `UPDATE "${collectionName}" SET "updated" = strftime('%Y-%m-%d %H:%M:%fZ') WHERE "updated" = ''`
        );
      }
    }
  } finally {
    db.close();
  }
}

async function buildCollections(pb) {
  const scaffolds = await pb.collections.getScaffolds();
  const liveCollections = await pb.collections.getFullList();
  const existingByName = new Map(liveCollections.map((collection) => [collection.name, collection]));

  function withExistingId(collection) {
    const existing = existingByName.get(collection.name);
    const normalized = { ...collection };

    if (!normalized.id) {
      delete normalized.id;
    }

    if (!normalized.created) {
      delete normalized.created;
    }

    if (!normalized.updated) {
      delete normalized.updated;
    }

    if (!existing) {
      return normalized;
    }

    return {
      ...normalized,
      id: existing.id,
    };
  }

  const businesses = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "businesses",
    listRule: buildPublicAppActiveBusinessRule(),
    viewRule: buildPublicAppActiveBusinessRule(),
    fields: [
      textField("name", { required: true }),
      textField("slug", { required: true }),
      textField("templateSlug"),
      textField("phone"),
      textField("email"),
      textField("address"),
      textField("timezone", { required: true }),
      boolField("active"),
      textField("publicProfileOverrides"),
      textField("cancellationPolicy"),
      // MercadoPago OAuth (per-business)
      textField("mpAccessToken"),
      textField("mpRefreshToken"),
      textField("mpCollectorId"),
      textField("mpTokenExpiresAt"),
      boolField("mpConnected"),
    ],
  };

  await pb.collections.import([businesses], false);

  const stageOneCollections = await pb.collections.getFullList();
  let idByName = Object.fromEntries(
    stageOneCollections.map((collection) => [collection.name, collection.id])
  );

  const users = {
    ...withExistingId(structuredClone(scaffolds.auth)),
    name: "users",
    fields: [
      relationField("business", idByName.businesses, { required: false }),
      selectField("role", ["owner", "admin", "staff", "public_app"]),
      boolField("active"),
    ],
  };

  const services = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "services",
    listRule: `${buildPublicAppActiveRelatedBusinessRule()} && active = true`,
    viewRule: `${buildPublicAppActiveRelatedBusinessRule()} && active = true`,
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      textField("name", { required: true }),
      textField("description"),
      numberField("durationMinutes", { required: true, min: 1 }),
      numberField("price"),
      boolField("featured"),
      textField("featuredLabel"),
      boolField("active"),
    ],
  };

  const availabilityRules = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "availability_rules",
    listRule: `${buildPublicAppActiveRelatedBusinessRule()} && active = true`,
    viewRule: `${buildPublicAppActiveRelatedBusinessRule()} && active = true`,
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      numberField("dayOfWeek", { required: true, min: 0, max: 6 }),
      textField("startTime", { required: true }),
      textField("endTime", { required: true }),
      boolField("active"),
    ],
  };

  const blockedSlots = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "blocked_slots",
    listRule: buildPublicAppActiveRelatedBusinessRule(),
    viewRule: buildPublicAppActiveRelatedBusinessRule(),
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      textField("blockedDate", { required: true }),
      textField("startTime", { required: true }),
      textField("endTime", { required: true }),
      textField("reason"),
    ],
  };

  const customers = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "customers",
    listRule: buildPublicAppActiveRelatedBusinessRule(),
    viewRule: buildPublicAppActiveRelatedBusinessRule(),
    createRule: buildPublicAppActiveRelatedBusinessRule(),
    updateRule: buildPublicAppActiveRelatedBusinessRule(),
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      textField("fullName", { required: true }),
      textField("phone"),
      textField("email"),
      textField("notes"),
    ],
  };

  const waitlistEntries = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "waitlist_entries",
    listRule: buildPublicAppActiveRelatedBusinessRule(),
    viewRule: buildPublicAppActiveRelatedBusinessRule(),
    createRule: buildPublicAppActiveRelatedBusinessRule(),
    updateRule: buildPublicAppActiveRelatedBusinessRule(),
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      relationField("service", idByName.services, { required: false }),
      textField("bookingDate", { required: true }),
      textField("fullName", { required: true }),
      textField("email", { required: true }),
      textField("phone"),
      boolField("notified"),
    ],
  };

  const reviews = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "reviews",
    listRule: buildPublicAppActiveRelatedBusinessRule(),
    viewRule: buildPublicAppActiveRelatedBusinessRule(),
    createRule: buildPublicAppActiveRelatedBusinessRule(),
    updateRule: buildPublicAppActiveRelatedBusinessRule(),
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      relationField("booking", idByName.bookings, { required: false }),
      relationField("service", idByName.services, { required: false }),
      textField("customerName", { required: true }),
      numberField("rating", { required: true, min: 1, max: 5 }),
      textField("comment"),
    ],
  };

  const bookings = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "bookings",
    listRule: `${buildPublicAppActiveRelatedBusinessRule()} && customer.business = business && service.business = business`,
    viewRule: `${buildPublicAppActiveRelatedBusinessRule()} && customer.business = business && service.business = business`,
    createRule: `${buildPublicAppActiveRelatedBusinessRule()} && customer.business = business && service.business = business && service.active = true`,
    updateRule: `${buildPublicAppActiveRelatedBusinessRule()} && customer.business = business && service.business = business && service.active = true`,
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      relationField("customer", idByName.customers, { required: true }),
      relationField("service", idByName.services, { required: true }),
      textField("bookingDate", { required: true }),
      textField("startTime", { required: true }),
      textField("endTime", { required: true }),
      selectField("status", [
        "pending",
        "pending_payment",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ]),
      textField("notes"),
      textField("paymentStatus"),
      numberField("paymentAmount"),
      textField("paymentCurrency"),
      textField("paymentProvider"),
      textField("paymentPreferenceId"),
      textField("paymentExternalId"),
    ],
  };

  const analyticsEvents = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "analytics_events",
    createRule: buildPublicAppActiveRelatedBusinessRule(),
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      textField("eventName", { required: true }),
      textField("pagePath", { required: true }),
      textField("source"),
      textField("medium"),
      textField("campaign"),
      textField("referrer"),
    ],
  };

  const rateLimitEvents = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "rate_limit_events",
    listRule: null,
    viewRule: null,
    createRule: buildAdminOnlyRule(),
    updateRule: null,
    deleteRule: buildAdminOnlyRule(),
    fields: [
      textField("bucket", { required: true }),
      textField("identifierHash", { required: true }),
      textField("expiresAt", { required: true }),
    ],
  };

  const bookingLocks = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "booking_locks",
    listRule: null,
    viewRule: null,
    createRule: buildAdminOnlyRule(),
    updateRule: null,
    deleteRule: buildAdminOnlyRule(),
    fields: [
      textField("lockKey", { required: true }),
      textField("expiresAt", { required: true }),
    ],
    indexes: [
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_locks_lock_key ON booking_locks (lockKey)",
    ],
  };

  const communicationEvents = {
    ...withExistingId(structuredClone(scaffolds.base)),
    name: "communication_events",
    fields: [
      relationField("business", idByName.businesses, { required: true }),
      relationField("booking", idByName.bookings, { required: true }),
      relationField("customer", idByName.customers, { required: true }),
      selectField("channel", ["email", "whatsapp"]),
      selectField("kind", ["confirmation", "reminder", "followup"]),
      selectField("status", ["sent", "failed"]),
      textField("recipient"),
      textField("subject"),
      textField("note"),
    ],
  };

  await pb.collections.import(
    [
      businesses,
      users,
      services,
      availabilityRules,
      blockedSlots,
      customers,
      waitlistEntries,
      analyticsEvents,
      rateLimitEvents,
      bookingLocks,
    ],
    false
  );

  const stageTwoCollections = await pb.collections.getFullList();
  idByName = Object.fromEntries(
    stageTwoCollections.map((collection) => [collection.name, collection.id])
  );

  bookings.fields[0] = relationField("business", idByName.businesses, { required: true });
  bookings.fields[1] = relationField("customer", idByName.customers, { required: true });
  bookings.fields[2] = relationField("service", idByName.services, { required: true });

  await pb.collections.import([bookings], false);

  reviews.fields[0] = relationField("business", idByName.businesses, { required: true });
  reviews.fields[1] = relationField("booking", idByName.bookings, { required: false });
  reviews.fields[2] = relationField("service", idByName.services, { required: false });

  await pb.collections.import([reviews], false);

  const stageThreeCollections = await pb.collections.getFullList();
  idByName = Object.fromEntries(
    stageThreeCollections.map((collection) => [collection.name, collection.id])
  );

  communicationEvents.fields[0] = relationField("business", idByName.businesses, { required: true });
  communicationEvents.fields[1] = relationField("booking", idByName.bookings, { required: true });
  communicationEvents.fields[2] = relationField("customer", idByName.customers, { required: true });

  await pb.collections.import([communicationEvents], false);
}

async function upsertByFilter(pb, collectionName, filter, data) {
  try {
    const existing = await pb.collection(collectionName).getFirstListItem(filter);
    return pb.collection(collectionName).update(existing.id, data);
  } catch {
    return pb.collection(collectionName).create(data);
  }
}

async function seedData(pb) {
  const storePath = path.join(rootDir, "data", "local-store.seed.json");
  const store = JSON.parse(await fs.readFile(storePath, "utf8"));
  const businessIdMap = new Map();
  const serviceIdMap = new Map();
  const customerIdMap = new Map();

  for (const business of store.businesses) {
    const created = await upsertByFilter(
      pb,
      "businesses",
      pb.filter("slug = {:slug}", { slug: business.slug }),
      {
        name: business.name,
        slug: business.slug,
        templateSlug: business.templateSlug ?? business.slug,
        phone: business.phone ?? "",
        email: business.email ?? "",
        address: business.address ?? "",
        timezone: business.timezone ?? "America/Argentina/Buenos_Aires",
        active: business.active ?? true,
        publicProfileOverrides: JSON.stringify(business.publicProfileOverrides ?? {}),
      }
    );
    businessIdMap.set(business.id, created.id);
  }

  for (const service of store.services) {
    const created = await upsertByFilter(
      pb,
      "services",
      pb.filter("business = {:business} && name = {:name}", {
        business: businessIdMap.get(service.businessId),
        name: service.name,
      }),
      {
        business: businessIdMap.get(service.businessId),
        name: service.name,
        description: service.description ?? "",
        durationMinutes: service.durationMinutes,
        price: service.price ?? 0,
        featured: service.featured ?? false,
        featuredLabel: service.featuredLabel ?? "",
        active: service.active ?? true,
      }
    );
    serviceIdMap.set(service.id, created.id);
  }

  for (const customer of store.customers) {
    const customerFilter = customer.phone
      ? pb.filter("business = {:business} && phone = {:phone}", {
          business: businessIdMap.get(customer.businessId),
          phone: customer.phone,
        })
      : pb.filter("business = {:business} && email = {:email}", {
          business: businessIdMap.get(customer.businessId),
          email: customer.email ?? "",
        });

    const created = await upsertByFilter(
      pb,
      "customers",
      customerFilter,
      {
        business: businessIdMap.get(customer.businessId),
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email ?? "",
        notes: customer.notes ?? "",
      }
    );
    customerIdMap.set(customer.id, created.id);
  }

  for (const rule of store.availabilityRules) {
    await upsertByFilter(
      pb,
      "availability_rules",
      pb.filter(
        "business = {:business} && dayOfWeek = {:dayOfWeek} && startTime = {:startTime} && endTime = {:endTime}",
        {
          business: businessIdMap.get(rule.businessId),
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
        }
      ),
      {
        business: businessIdMap.get(rule.businessId),
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: rule.active ?? true,
      }
    );
  }

  for (const slot of store.blockedSlots) {
    await upsertByFilter(
      pb,
      "blocked_slots",
      pb.filter(
        "business = {:business} && blockedDate = {:blockedDate} && startTime = {:startTime}",
        {
          business: businessIdMap.get(slot.businessId),
          blockedDate: slot.blockedDate,
          startTime: slot.startTime,
        }
      ),
      {
        business: businessIdMap.get(slot.businessId),
        blockedDate: slot.blockedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: slot.reason ?? "",
      }
    );
  }

  for (const booking of store.bookings) {
    await upsertByFilter(
      pb,
      "bookings",
      pb.filter(
        "business = {:business} && bookingDate = {:bookingDate} && startTime = {:startTime} && customer = {:customer}",
        {
          business: businessIdMap.get(booking.businessId),
          bookingDate: booking.bookingDate,
          startTime: booking.startTime,
          customer: customerIdMap.get(booking.customerId),
        }
      ),
      {
        business: businessIdMap.get(booking.businessId),
        customer: customerIdMap.get(booking.customerId),
        service: serviceIdMap.get(booking.serviceId),
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes ?? "",
      }
    );
  }
}

async function seedDemoOwner(pb) {
  const email = process.env.POCKETBASE_DEMO_OWNER_EMAIL;
  const password = process.env.POCKETBASE_DEMO_OWNER_PASSWORD;
  const businessSlug = process.env.POCKETBASE_DEMO_OWNER_BUSINESS_SLUG ?? "demo-barberia";

  if (!email || !password) {
    return;
  }

  const business = await pb
    .collection("businesses")
    .getFirstListItem(pb.filter("slug = {:slug}", { slug: businessSlug }));

  await upsertByFilter(
    pb,
    "users",
    pb.filter("email = {:email}", { email }),
    {
      email,
      password,
      passwordConfirm: password,
      name: "Demo Owner",
      business: business.id,
      role: "owner",
      active: true,
      verified: true,
    }
  );
}

async function seedPublicAppUser(pb) {
  const email = process.env.POCKETBASE_PUBLIC_AUTH_EMAIL;
  const password = process.env.POCKETBASE_PUBLIC_AUTH_PASSWORD;
  const businessSlug =
    process.env.POCKETBASE_DEMO_OWNER_BUSINESS_SLUG ?? "demo-barberia";

  if (!email || !password) {
    return;
  }

  const business = await pb
    .collection("businesses")
    .getFirstListItem(pb.filter("slug = {:slug}", { slug: businessSlug }));

  await upsertByFilter(
    pb,
    "users",
    pb.filter("email = {:email}", { email }),
    {
      email,
      password,
      passwordConfirm: password,
      name: "ReservaYa Public App",
      business: business.id,
      role: "public_app",
      active: true,
      verified: true,
    }
  );
}

async function main() {
  await loadEnvFile();

  const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!baseUrl || !adminEmail || !adminPassword) {
    throw new Error(
      "Define NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL y POCKETBASE_ADMIN_PASSWORD en .env.local."
    );
  }

  const pb = new PocketBase(baseUrl);
  await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword);

  await buildCollections(pb);
  repairBaseCollectionTimestamps();
  await seedData(pb);
  await seedDemoOwner(pb);
  await seedPublicAppUser(pb);

  console.log("PocketBase listo con colecciones y seed demo.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
