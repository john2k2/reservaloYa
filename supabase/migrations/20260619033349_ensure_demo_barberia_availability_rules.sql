-- Asegura que el negocio demo /demo-barberia tenga reglas de disponibilidad activas.
-- Esto corrige el caso en el que el seed no fue aplicado o las reglas fueron borradas.
INSERT INTO availability_rules (id, business_id, "dayOfWeek", "startTime", "endTime", active, created)
VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 1, '09:00', '18:00', TRUE, now()),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 3, '09:00', '18:00', TRUE, now()),
  ('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', 5, '10:00', '20:00', TRUE, now())
ON CONFLICT (id) DO UPDATE SET
  active = TRUE,
  "dayOfWeek" = EXCLUDED."dayOfWeek",
  "startTime" = EXCLUDED."startTime",
  "endTime" = EXCLUDED."endTime";
