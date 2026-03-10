import { describe, expect, it } from "vitest";

import { buildCsv, escapeCsvValue } from "./admin-exports";

describe("escapeCsvValue", () => {
  it("sanitizes formula-prefixed values", () => {
    expect(escapeCsvValue("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvValue("+123")).toBe("'+123");
    expect(escapeCsvValue("-10")).toBe("'-10");
    expect(escapeCsvValue("@cmd")).toBe("'@cmd");
    expect(escapeCsvValue("\tTAB")).toBe("'\tTAB");
    expect(escapeCsvValue("\rCR")).toBe("\"'\rCR\"");
  });

  it("keeps CSV escaping after sanitizing", () => {
    expect(escapeCsvValue('=HYPERLINK("http://malicious")')).toBe(
      '"\'=HYPERLINK(""http://malicious"")"'
    );
    expect(escapeCsvValue("safe,value")).toBe('"safe,value"');
    expect(escapeCsvValue('safe"value')).toBe('"safe""value"');
  });
});

describe("buildCsv", () => {
  it("applies sanitization to all cells", () => {
    const csv = buildCsv(["name", "note"], [["=2+2", "safe"]]);

    expect(csv).toBe("name,note\n'=2+2,safe");
  });
});
