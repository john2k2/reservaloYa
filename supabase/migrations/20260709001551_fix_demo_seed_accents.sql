-- The 014/016 seed migrations inserted demo-barberia and demo-estetica
-- services without accents ("Corte clasico", "terminacion", "Exfoliacion"),
-- out of sync with src/constants/demo.ts (used by the signup preset seeding
-- and the "Barbería Libertador" / "Aura Estética" demo pages copy). Fixing
-- the actual rows so the demo pages read correctly. Matched by the fixed
-- demo IDs from demo.ts, not by text, so this is safe to re-run.

UPDATE services SET name = 'Corte clásico', description = 'Corte con terminación prolija para uso diario.'
  WHERE id = '22222222-2222-2222-2222-222222222221';
UPDATE services SET description = 'Servicio completo con perfilado y terminación.'
  WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE services SET description = 'Repaso rápido para mantener prolijo el look.'
  WHERE id = '22222222-2222-2222-2222-222222222223';

UPDATE services SET description = 'Exfoliación precisa para mejorar textura, luminosidad y absorción de activos.'
  WHERE id = 'aaaaaaaa-2222-2222-2222-222222222222';
UPDATE services SET name = 'Lifting de pestañas', description = 'Curvatura y definición natural con acabado prolijo para varias semanas.'
  WHERE id = 'aaaaaaaa-2222-2222-2222-222222222223';
