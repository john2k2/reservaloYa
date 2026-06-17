import { describe, expect, it } from "vitest";

import {
  buildConfirmationEmailHtml,
  buildReminderEmailHtml,
  buildBusinessNotificationHtml,
  buildFollowUpEmailHtml,
  escapeHtml,
} from "./email-templates";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
    );
    expect(escapeHtml('"quoted" & <tag>')).toBe('&quot;quoted&quot; &amp; &lt;tag&gt;');
  });

  it("returns empty string for null or undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("converts numbers to string", () => {
    expect(escapeHtml(123)).toBe("123");
  });

  it("does not alter safe text", () => {
    expect(escapeHtml("Juan Pérez")).toBe("Juan Pérez");
  });
});

describe("buildConfirmationEmailHtml", () => {
  it("escapes user-controlled values before interpolating into HTML", () => {
    const html = buildConfirmationEmailHtml({
      mode: "created",
      customerName: "<b>Mallory</b>",
      businessName: "Negocio & Co",
      serviceName: 'Corte "especial"',
      date: "2026-03-20",
      time: "10:00",
      duration: "30 minutos",
      price: null,
      address: "Calle 123 <script>alert(1)</script>",
      manageUrl: "http://example.com/?a=1&b=2",
    });

    expect(html).toContain("&lt;b&gt;Mallory&lt;/b&gt;");
    expect(html).toContain("Negocio &amp; Co");
    expect(html).toContain('Corte &quot;especial&quot;');
    expect(html).toContain("Calle 123 &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain('href="http://example.com/?a=1&amp;b=2"');
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});

describe("buildReminderEmailHtml", () => {
  it("escapes user-controlled values before interpolating into HTML", () => {
    const html = buildReminderEmailHtml({
      customerName: "<img src=x onerror=alert(1)>",
      businessName: "Negocio 'Raro'",
      serviceName: "Servicio & Más",
      date: "2026-03-20",
      time: "10:00",
      address: "Dirección <b>negrita</b>",
      manageUrl: "http://example.com/reservar",
    });

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("Negocio &#39;Raro&#39;");
    expect(html).toContain("Servicio &amp; Más");
    expect(html).toContain("Dirección &lt;b&gt;negrita&lt;/b&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
  });
});

describe("buildBusinessNotificationHtml", () => {
  it("escapes user-controlled values before interpolating into HTML", () => {
    const html = buildBusinessNotificationHtml({
      mode: "created",
      businessName: "Negocio <script>",
      customerName: "<svg onload=alert(1)>",
      customerEmail: "a@b.com",
      customerPhone: "+5491112345678",
      serviceName: "Corte & Barba",
      date: "2026-03-20",
      time: "10:00",
      duration: "30 minutos",
      adminUrl: "http://admin.example.com/?id=1&tab=bookings",
    });

    expect(html).toContain("Negocio &lt;script&gt;");
    expect(html).toContain("&lt;svg onload=alert(1)&gt;");
    expect(html).toContain("Corte &amp; Barba");
    expect(html).toContain('href="http://admin.example.com/?id=1&amp;tab=bookings"');
    expect(html).not.toContain("<svg onload=alert(1)>");
  });
});

describe("buildFollowUpEmailHtml", () => {
  it("escapes user-controlled values before interpolating into HTML", () => {
    const html = buildFollowUpEmailHtml({
      customerName: "<script>alert(1)</script>",
      businessName: "Negocio & Co",
      businessSlug: "negocio-co",
      serviceName: 'Servicio "Premium"',
      bookingDate: "2026-03-20",
      bookingUrl: "http://example.com/negocio-co/reservar",
      reviewUrl: "http://example.com/negocio-co/resena?booking=1&token=abc",
    });

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Negocio &amp; Co");
    expect(html).toContain('Servicio &quot;Premium&quot;');
    expect(html).toContain('href="http://example.com/negocio-co/reservar"');
    expect(html).toContain(
      'href="http://example.com/negocio-co/resena?booking=1&amp;token=abc"'
    );
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
