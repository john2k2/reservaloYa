#!/usr/bin/env node

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function normalizeWhatsAppPhone(phone) {
  const raw = String(phone ?? "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/[^\d+]/g, "");
  const compact =
    normalized.startsWith("+") ? `+${normalized.slice(1).replace(/\+/g, "")}` : normalized;

  if (!compact.startsWith("+") || compact.length < 8) {
    return null;
  }

  return `whatsapp:${compact}`;
}

async function sendTestEmail({ to, dryRun }) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = process.env.RESEND_FROM_EMAIL ?? "ReservaYa <onboarding@resend.dev>";

  const payload = {
    from,
    to,
    subject: "ReservaYa | prueba de email",
    text: [
      "Esta es una prueba de email transaccional de ReservaYa.",
      "",
      "Si recibiste este mensaje, la integracion con Resend funciona.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h1 style="font-size:20px;margin-bottom:12px">Prueba de email</h1>
        <p>Esta es una prueba de email transaccional de ReservaYa.</p>
        <p>Si recibiste este mensaje, la integracion con Resend funciona.</p>
      </div>
    `,
  };

  if (dryRun) {
    console.log(JSON.stringify({ channel: "email", dryRun: true, payload }, null, 2));
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Resend error ${response.status}: ${body}`);
  }

  console.log(body);
}

async function sendTestWhatsApp({ to, dryRun }) {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const fromNumber = requireEnv("TWILIO_WHATSAPP_FROM");
  const templateSid = requireEnv("TWILIO_WHATSAPP_TEMPLATE_SID");
  const normalizedTo = normalizeWhatsAppPhone(to);

  if (!normalizedTo) {
    throw new Error("NOTIFICATIONS_TEST_PHONE must be in international format, for example +5491155550101");
  }

  const manageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://reservaya-kappa.vercel.app"}/demo-barberia`;
  const payload = new URLSearchParams({
    From: fromNumber,
    To: normalizedTo,
    ContentSid: templateSid,
    ContentVariables: JSON.stringify({
      "1": "Cliente QA",
      "2": "Demo Barberia",
      "3": "Afeitado clasico",
      "4": "2026-03-11",
      "5": "09:00",
      "6": manageUrl,
    }),
  });

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          channel: "whatsapp",
          dryRun: true,
          payload: Object.fromEntries(payload.entries()),
        },
        null,
        2
      )
    );
    return;
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    }
  );

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Twilio error ${response.status}: ${body}`);
  }

  console.log(body);
}

async function main() {
  const channel = getArg("--channel") ?? "both";
  const dryRun = hasFlag("--dry-run");
  const email = getArg("--email") ?? process.env.NOTIFICATIONS_TEST_EMAIL;
  const phone = getArg("--phone") ?? process.env.NOTIFICATIONS_TEST_PHONE;

  if ((channel === "email" || channel === "both") && !email) {
    throw new Error("Missing --email or NOTIFICATIONS_TEST_EMAIL");
  }

  if ((channel === "whatsapp" || channel === "both") && !phone) {
    throw new Error("Missing --phone or NOTIFICATIONS_TEST_PHONE");
  }

  if (channel === "email" || channel === "both") {
    await sendTestEmail({ to: email, dryRun });
  }

  if (channel === "whatsapp" || channel === "both") {
    await sendTestWhatsApp({ to: phone, dryRun });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
