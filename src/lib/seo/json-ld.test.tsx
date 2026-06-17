import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  FAQPageJsonLd,
  SoftwareApplicationJsonLd,
} from "@/lib/seo/json-ld";

function getLdJsonScript(): HTMLScriptElement | null {
  return document.querySelector('script[type="application/ld+json"]');
}

describe("json-ld XSS protection", () => {
  it("escapes </script> in SoftwareApplicationJsonLd props", () => {
    render(
      <SoftwareApplicationJsonLd
        name="</script><script>alert('xss')</script>"
        description="Safe description"
        url="https://example.com"
      />
    );

    const script = getLdJsonScript();
    expect(script).toBeInTheDocument();
    const content = script?.textContent ?? "";
    expect(content).toContain("Safe description");
    expect(content).not.toContain("</script>");
  });

  it("escapes </script> in FAQPageJsonLd questions and answers", () => {
    render(
      <FAQPageJsonLd
        faqs={[
          {
            question: "</script><script>alert('q')</script>",
            answer: "</script><script>alert('a')</script>",
          },
        ]}
      />
    );

    const content = getLdJsonScript()?.textContent ?? "";
    expect(content).not.toContain("</script>");
  });
});
