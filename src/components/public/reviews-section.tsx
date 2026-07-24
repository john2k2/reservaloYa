type Review = {
  customerName: string;
  rating: number;
  comment?: string;
};

type ReviewsSectionProps = {
  accentColor: string;
  reviews: Review[];
};

export function ReviewsSection({ accentColor, reviews }: ReviewsSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="mb-6 sm:mb-10">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
          Reseñas
        </p>
        <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Lo que dicen nuestros clientes
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, index) => (
          <article key={index} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="size-4" viewBox="0 0 20 20" fill={i < review.rating ? accentColor : "#e5e7eb"}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {review.comment && (
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">{review.comment}</p>
            )}
            <p className="text-xs font-medium text-muted-foreground">{review.customerName}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
