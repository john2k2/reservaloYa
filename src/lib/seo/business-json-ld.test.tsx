import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  BreadcrumbJsonLd,
  FAQJsonLd,
  LocalBusinessJsonLd,
  ServiceJsonLd,
  WebPageJsonLd,
} from "@/lib/seo/business-json-ld";

function getLdJsonScript(): HTMLScriptElement | null {
  return document.querySelector('script[type="application/ld+json"]');
}

describe("business-json-ld XSS protection", () => {
  it("renders LocalBusiness schema without executing injected </script>", () => {
    const xssPayload = "</script><script>alert('xss')</script>";

    render(
      <LocalBusinessJsonLd
        name={xssPayload}
        description="Safe description"
        url="https://example.com"
      />
    );

    const script = getLdJsonScript();
    expect(script).toBeInTheDocument();
    const content = script?.textContent ?? "";
    expect(content).toContain("Safe description");
    expect(content).not.toContain("</script>");
    expect(content).toMatch(/<\\\/?script>/);
  });

  it("escapes </script> inside nested address and service values", () => {
    const xssAddress = "Calle Falsa 123, </script><script>alert('addr')</script>";
    const xssService = "</script><script>alert('service')</script>";

    render(
      <LocalBusinessJsonLd
        name="Negocio"
        description="Desc"
        url="https://example.com"
        address={xssAddress}
        services={[xssService]}
      />
    );

    const content = getLdJsonScript()?.textContent ?? "";
    expect(content).not.toContain("</script>");
    expect(content).toContain("Calle Falsa 123");
  });

  it("escapes </script> in ServiceJsonLd values", () => {
    render(
      <ServiceJsonLd
        businessName="</script><script>alert('biz')</script>"
        businessUrl="https://example.com"
        serviceName="Corte"
        description="Safe"
      />
    );

    const content = getLdJsonScript()?.textContent ?? "";
    expect(content).not.toContain("</script>");
    expect(content).toContain('"name":"Corte"');
  });

  it("escapes </script> in WebPageJsonLd values", () => {
    render(
      <WebPageJsonLd
        name="</script><script>alert('page')</script>"
        description="Safe"
        url="https://example.com"
      />
    );

    const content = getLdJsonScript()?.textContent ?? "";
    expect(content).not.toContain("</script>");
    expect(content).toContain('"description":"Safe"');
  });

  it("escapes </script> in BreadcrumbJsonLd items", () => {
    render(
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://example.com" },
          { name: "</script><script>alert('xss')</script>", url: "https://example.com/xss" },
        ]}
      />
    );

    const content = getLdJsonScript()?.textContent ?? "";
    expect(content).not.toContain("</script>");
  });

  it("escapes </script> in FAQJsonLd questions and answers", () => {
    render(
      <FAQJsonLd
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
