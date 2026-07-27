-- 20260725120000_add_business_published_flag.sql agrego la columna `published`
-- pero no le dio GRANT a anon/authenticated. Desde 20260620000000 (RLS por
-- columnas explicitas), cualquier columna nueva queda sin acceso hasta que se
-- otorga explicitamente -- Postgres devuelve 42501 (permission denied) apenas
-- una query la referencia, sin importar el valor de la fila.
--
-- Esto rompio la pagina publica de TODOS los negocios: getSupabasePublicBusinessPageData
-- y el sitemap empezaron a seleccionar/filtrar por `published`, el error de
-- permisos hacia que la query fallara siempre, y el codigo trata ese fallo
-- como "negocio no encontrado" -> 404 en cualquier slug.

GRANT SELECT (published) ON businesses TO anon, authenticated;
