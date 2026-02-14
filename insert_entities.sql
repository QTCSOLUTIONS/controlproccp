-- Script para insertar nuevas entidades en Supabase
-- Se asume que existe al menos un usuario en la tabla 'people' para asignar como responsable.
-- Puedes cambiar el responsable_id por un UUID específico si lo deseas.

INSERT INTO audit_entities (name, responsible_id, scope, status, progress, start_date)
SELECT 
  e.name,
  (SELECT id FROM people LIMIT 1), -- Asigna el primer usuario encontrado como responsable por defecto
  'Auditoría Inicial 2026', -- Alcance por defecto
  'Planning',
  0,
  CURRENT_DATE
FROM (VALUES 
  ('Islacana Investments'),
  ('Atlantida (Urbanización)'),
  ('Atlantida (River Island)'),
  ('Noval Cortecito (Oceana)')
) AS e(name)
WHERE NOT EXISTS (
  SELECT 1 FROM audit_entities WHERE name = e.name
);
