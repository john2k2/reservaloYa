import { describe, expect, it } from "vitest";

import { safeJsonLdStringify } from "./safe-json-ld";

describe("safeJsonLdStringify", () => {
  it("stringifies a normal schema", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Barbería Demo",
      description: "Una barbería de prueba.",
    };

    expect(safeJsonLdStringify(schema)).toBe(JSON.stringify(schema));
  });

  it("escapes closing script tags in string values", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "</script><script>alert('xss')</script>",
    };

    const result = safeJsonLdStringify(schema);

    expect(result).not.toContain("</script>");
    expect(result).toContain("<\\/script>");
  });

  it("escapes closing script tags nested in objects and arrays", () => {
    const schema = {
      provider: {
        name: "</script>",
      },
      offers: [{
        description: "</script>",
      }],
    };

    const result = safeJsonLdStringify(schema);

    expect(result).not.toContain("</script>");
    expect(result).toContain("<\\/script>");
  });
});
