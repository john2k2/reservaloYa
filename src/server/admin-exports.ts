export function escapeCsvValue(value: string | number | null | undefined) {
  const normalized = String(value ?? "");
  const sanitized = /^[=+\-@\t\r]/.test(normalized) ? `'${normalized}` : normalized;

  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

export function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");
}

export function buildCsvHeaders(filename: string) {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
}
