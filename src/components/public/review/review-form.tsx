"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { submitReviewAction, type ReviewActionResult } from "@/server/actions/review";

interface ReviewFormProps {
  businessSlug: string;
  bookingId: string;
  manageToken: string;
  accentColor: string;
}

export function ReviewForm({
  businessSlug,
  bookingId,
  manageToken,
  accentColor,
}: ReviewFormProps) {
  const [state, action, isPending] = useActionState<ReviewActionResult | null, FormData>(
    submitReviewAction,
    null
  );
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card/95 px-6 py-10 text-center shadow-sm">
        <CheckCircle2 className="size-10" style={{ color: accentColor }} />
        <div>
          <p className="text-lg font-semibold text-foreground">¡Gracias por tu reseña!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu opinión nos ayuda a mejorar el servicio.
          </p>
        </div>
      </div>
    );
  }

  const activeRating = hovered || selected;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm sm:p-8">
      <form action={action} className="space-y-6">
        <input type="hidden" name="businessSlug" value={businessSlug} />
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="manageToken" value={manageToken} />
        <input type="hidden" name="rating" value={selected} />

        {/* Star rating */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-foreground">Tu calificación</p>
          <div className="flex gap-1" role="group" aria-label="Calificación con estrellas">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                onClick={() => setSelected(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="p-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Star
                  className="size-8"
                  style={{
                    fill: star <= activeRating ? accentColor : "transparent",
                    color: star <= activeRating ? accentColor : "currentColor",
                  }}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          {selected > 0 && (
            <p className="text-xs text-muted-foreground">
              {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][selected]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-1.5">
          <label htmlFor="review-comment" className="text-sm font-medium text-foreground">
            Comentario <span className="text-muted-foreground/60">(opcional)</span>
          </label>
          <textarea
            id="review-comment"
            name="comment"
            placeholder="Contanos tu experiencia..."
            maxLength={1000}
            rows={4}
            className="minimalist-input w-full resize-none text-sm"
          />
        </div>

        {state && !state.success && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending || selected === 0}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: accentColor }}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {isPending ? "Enviando..." : "Enviar reseña"}
        </button>
      </form>
    </div>
  );
}
