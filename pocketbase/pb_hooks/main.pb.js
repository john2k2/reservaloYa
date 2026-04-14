/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: intercepta todos los emails de PocketBase y los envía via Resend HTTP API.
 *
 * Railway (y muchos cloud providers) bloquean los puertos SMTP (465, 587).
 * Este hook evita ese problema usando la API HTTP de Resend directamente.
 *
 * Requiere la variable de entorno RESEND_API_KEY en el servicio de Railway.
 */
onMailerSend((e) => {
    const apiKey = $os.getenv("RESEND_API_KEY");

    if (!apiKey) {
        // Sin API key — intentar con el mailer por defecto (fallback, probablemente falle)
        console.warn("[mailer] RESEND_API_KEY no configurada. El email no se enviará.");
        e.next();
        return;
    }

    const toAddresses = e.message.to.map((addr) => {
        return addr.name ? addr.name + " <" + addr.address + ">" : addr.address;
    });

    // Siempre usar el dominio verificado en Resend.
    // PocketBase puede tener configurado un remitente inválido (ej: noreply@example.com).
    const VERIFIED_SENDER = "ReservaYa <turnos@reservaya.ar>";
    const rawFrom = e.message.from && e.message.from.address ? e.message.from.address : "";
    const from = rawFrom && !rawFrom.endsWith("@example.com")
        ? (e.message.from.name
            ? e.message.from.name + " <" + rawFrom + ">"
            : rawFrom)
        : VERIFIED_SENDER;

    const payload = {
        from: from,
        to: toAddresses,
        subject: e.message.subject || "(sin asunto)",
        html: e.message.html || "",
    };

    if (e.message.text) {
        payload.text = e.message.text;
    }

    const res = $http.send({
        url: "https://api.resend.com/emails",
        method: "POST",
        headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        timeout: 15,
    });

    if (res.statusCode >= 400) {
        throw new Error("[mailer] Resend API error " + res.statusCode + ": " + res.raw);
    }

    console.log("[mailer] Email enviado via Resend a:", toAddresses.join(", "), "| subject:", payload.subject);
});
