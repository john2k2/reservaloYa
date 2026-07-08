-- The public business page queries reviews as anon (business.ts:
-- rating >= 4, latest 6) but reviews only ever had authenticated
-- team policies, so the query always failed with permission denied and
-- real customer reviews never appeared publicly -- only the template's
-- hardcoded testimonials. This mirrors the app's own display rule in RLS:
-- anon can only read high-rated reviews of active businesses, so low
-- ratings stay private even through the raw REST API.
CREATE POLICY "public_high_rated_reviews_read_anon" ON reviews
  FOR SELECT TO anon
  USING (
    rating >= 4
    AND EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = reviews.business_id AND b.active = true
    )
  );

-- anon also needs the base table grant (RLS narrows it to the rows above).
GRANT SELECT ON reviews TO anon;
