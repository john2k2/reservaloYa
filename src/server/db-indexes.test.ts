import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

function loadMigrationSql() {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  return files.map((file) => fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8")).join("\n");
}

function hasIndex(sql: string, table: string, columns: string[]) {
  const normalizedColumns = columns.map((c) => c.replace(/"/g, "").toLowerCase());
  const indexRegex = new RegExp(
    `create\\s+index\\s+(?:if\\s+not\\s+exists\\s+)?\\S+\\s+on\\s+${table}\\s*\\(([^)]+)\\)`,
    "gi"
  );
  let match: RegExpExecArray | null;
  while ((match = indexRegex.exec(sql)) !== null) {
    const cols = match[1]
      .split(",")
      .map((c) => c.trim().replace(/"/g, "").toLowerCase());
    if (normalizedColumns.every((col, idx) => cols[idx] === col)) {
      return true;
    }
  }
  return false;
}

describe("DB performance indexes", () => {
  const sql = loadMigrationSql();

  it("has explicit indexes on bookings for common list filters", () => {
    expect(hasIndex(sql, "bookings", ["business_id", "bookingDate", "status"])).toBe(true);
    expect(hasIndex(sql, "bookings", ["business_id", "status", "startTime"])).toBe(true);
  });

  it("has explicit indexes on customers for business lookups by email and phone", () => {
    expect(hasIndex(sql, "customers", ["business_id", "email"])).toBe(true);
    expect(hasIndex(sql, "customers", ["business_id", "phone"])).toBe(true);
  });

  it("has explicit indexes on services, availability_rules and blocked_slots", () => {
    expect(hasIndex(sql, "services", ["business_id"])).toBe(true);
    expect(hasIndex(sql, "availability_rules", ["business_id", "dayOfWeek"])).toBe(true);
    expect(hasIndex(sql, "blocked_slots", ["business_id", "blockedDate"])).toBe(true);
  });

  it("has explicit indexes on communication_events and analytics_events", () => {
    expect(hasIndex(sql, "communication_events", ["business_id", "booking_id"])).toBe(true);
    expect(hasIndex(sql, "communication_events", ["business_id", "kind", "status"])).toBe(true);
    expect(hasIndex(sql, "analytics_events", ["business_id", "eventName", "created"])).toBe(true);
  });
});
