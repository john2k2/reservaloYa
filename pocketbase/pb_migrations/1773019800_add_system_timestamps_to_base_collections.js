/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collectionNames = [
    "businesses",
    "services",
    "availability_rules",
    "blocked_slots",
    "customers",
    "bookings",
    "analytics_events",
    "communication_events",
  ];
  const tables = arrayOf(new DynamicModel({ name: "" }));

  app.db()
    .newQuery("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all(tables);

  const existingTables = new Set(tables.map((table) => table.name));

  for (const collectionName of collectionNames) {
    if (!existingTables.has(collectionName)) {
      continue;
    }

    const columns = arrayOf(new DynamicModel({ name: "" }));

    app.db().newQuery(`PRAGMA table_info(\`${collectionName}\`)`).all(columns);

    const columnNames = columns.map((column) => column.name);

    if (!columnNames.includes("created")) {
      app.db()
        .newQuery(
          `ALTER TABLE \`${collectionName}\` ADD COLUMN \`created\` TEXT DEFAULT '' NOT NULL`
        )
        .execute();
      app.db()
        .newQuery(
          `UPDATE \`${collectionName}\` SET \`created\` = strftime('%Y-%m-%d %H:%M:%fZ') WHERE \`created\` = ''`
        )
        .execute();
    }

    if (!columnNames.includes("updated")) {
      app.db()
        .newQuery(
          `ALTER TABLE \`${collectionName}\` ADD COLUMN \`updated\` TEXT DEFAULT '' NOT NULL`
        )
        .execute();
      app.db()
        .newQuery(
          `UPDATE \`${collectionName}\` SET \`updated\` = strftime('%Y-%m-%d %H:%M:%fZ') WHERE \`updated\` = ''`
        )
        .execute();
    }
  }
}, () => {
  // We keep the rollback empty to avoid destructive schema changes in dev data.
});
