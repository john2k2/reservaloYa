import { Resend } from "resend";

import { createBookingManageToken, getPublicAppUrl } from "@/server/public-booking-links";

type BookingEmailInput = {
  bookingId: string;
  businessSlug: string;
  customerName: string;
  customerEmail?: string;
  mode?: "created" | "rescheduled";
  confirmation: {
    businessName: string;
    businessAddress: string;
    businessTimezone: string;
    bookingDate: string;
    startTime: string;
    serviceName: string;
    durationMinutes: number;
  };
};

type BookingEmailResult = {
  status: "sent" | "skipped" | "failed";
  subject: string;
  reason?: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? "ReservaYa <onboarding@resend.dev>";
}

async function sendBookingEmail(input: {
  customerName: string;
  customerEmail?: string;
  subject: string;
  heading: string;
  businessSlug: string;
  bookingId: string;
  confirmation: BookingEmailInput["confirmation"];
}): Promise<BookingEmailResult> {
  if (!input.customerEmail) {
    return {
      status: "skipped",
      subject: input.subject,
      reason: "missing_customer_email",
    };
  }

  const resend = getResendClient();

  if (!resend) {
    return {
      status: "skipped",
      subject: input.subject,
      reason: "missing_resend_api_key",
    };
  }

  const manageToken = createBookingManageToken(input.businessSlug, input.bookingId);
  const manageUrl = `${getPublicAppUrl()}/${input.businessSlug}/mi-turno?booking=${input.bookingId}&token=${manageToken}`;

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: input.customerEmail,
      subject: input.subject,
      text: [
        `Hola ${input.customerName || "cliente"},`,
        "",
        input.heading,
        `${input.confirmation.serviceName} - ${input.confirmation.bookingDate} a las ${input.confirmation.startTime}`,
        `${input.confirmation.businessName} - ${input.confirmation.businessAddress}`,
        "",
        `Gestionar turno: ${manageUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h1 style="font-size:20px;margin-bottom:12px">${input.heading}</h1>
          <p>Hola ${input.customerName || "cliente"},</p>
          <p>
            <strong>${input.confirmation.serviceName}</strong><br />
            ${input.confirmation.bookingDate} a las ${input.confirmation.startTime}<br />
            ${input.confirmation.businessName}<br />
            ${input.confirmation.businessAddress}
          </p>
          <p>
            <a
              href="${manageUrl}"
              style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px"
            >
              Ver, reprogramar o cancelar
            </a>
          </p>
        </div>
      `,
    });

    return {
      status: "sent",
      subject: input.subject,
    };
  } catch (error) {
    console.error("Failed to send booking email", error);

    return {
      status: "failed",
      subject: input.subject,
      reason: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

export async function sendBookingConfirmationEmail(input: BookingEmailInput) {
  const actionLabel =
    input.mode === "rescheduled" ? "Tu turno fue reprogramado" : "Tu turno fue confirmado";
  const subject =
    input.mode === "rescheduled"
      ? `${input.confirmation.businessName}: tu turno fue reprogramado`
      : `${input.confirmation.businessName}: confirmacion de tu turno`;

  return sendBookingEmail({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    subject,
    heading: actionLabel,
    businessSlug: input.businessSlug,
    bookingId: input.bookingId,
    confirmation: input.confirmation,
  });
}

export async function sendBookingReminderEmail(input: BookingEmailInput) {
  return sendBookingEmail({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    subject: `${input.confirmation.businessName}: recordatorio de tu turno`,
    heading: "Te recordamos tu proximo turno",
    businessSlug: input.businessSlug,
    bookingId: input.bookingId,
    confirmation: input.confirmation,
  });
}
