-- Enable useful extensions for FTS
BEGIN;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a robust, RLS-respecting global search function
DROP FUNCTION IF EXISTS public.global_search(text, integer, integer);
CREATE OR REPLACE FUNCTION public.global_search(
  search_query text,
  max_results integer DEFAULT 20,
  page_offset integer DEFAULT 0
)
RETURNS TABLE (
  entity text,
  id uuid,
  title text,
  snippet text,
  rank real
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $func$
DECLARE
  q text := trim(search_query);
  parts text[] := ARRAY[]::text[];
  sql text;
BEGIN
  IF q IS NULL OR q = '' THEN
    RETURN;
  END IF;

  -- Subjects
  IF to_regclass('public.subjects') IS NOT NULL THEN
    parts := parts || format(
      $$select 'subject'::text as entity, id, coalesce(name,'') as title, left(coalesce(description,''), 200) as snippet,
        ts_rank(
          to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(description,''))),
          plainto_tsquery('simple', unaccent(%L))
        ) as rank
      from public.subjects
      where to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(description,'')))
            @@ plainto_tsquery('simple', unaccent(%L))$$
      , q, q
    );
  END IF;

  -- Assignments
  IF to_regclass('public.assignments') IS NOT NULL THEN
    parts := parts || format(
      $$select 'assignment'::text as entity, id, coalesce(title,'') as title, left(coalesce(description,''), 200) as snippet,
        ts_rank(
          to_tsvector('simple', unaccent(coalesce(title,'') || ' ' || coalesce(description,''))),
          plainto_tsquery('simple', unaccent(%L))
        ) as rank
      from public.assignments
      where to_tsvector('simple', unaccent(coalesce(title,'') || ' ' || coalesce(description,'')))
            @@ plainto_tsquery('simple', unaccent(%L))$$
      , q, q
    );
  END IF;

  -- Classes
  IF to_regclass('public.classes') IS NOT NULL THEN
    parts := parts || format(
      $$select 'class'::text as entity, id, coalesce(name,'') as title, left(coalesce(description,''), 200) as snippet,
        ts_rank(
          to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(description,''))),
          plainto_tsquery('simple', unaccent(%L))
        ) as rank
      from public.classes
      where to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(description,'')))
            @@ plainto_tsquery('simple', unaccent(%L))$$
      , q, q
    );
  END IF;

  -- Profiles
  IF to_regclass('public.profiles') IS NOT NULL THEN
    parts := parts || format(
      $$select 'profile'::text as entity, id,
        trim(both ' ' from coalesce(first_name,'') || ' ' || coalesce(last_name,'')) as title,
        coalesce(role,'') as snippet,
        ts_rank(
          to_tsvector('simple', unaccent(coalesce(first_name,'') || ' ' || coalesce(last_name,''))),
          plainto_tsquery('simple', unaccent(%L))
        ) as rank
      from public.profiles
      where to_tsvector('simple', unaccent(coalesce(first_name,'') || ' ' || coalesce(last_name,'')))
            @@ plainto_tsquery('simple', unaccent(%L))$$
      , q, q
    );
  END IF;

  IF array_length(parts, 1) IS NULL THEN
    RETURN;
  END IF;

  sql := 'select * from (' || array_to_string(parts, ' union all ') || ') s\n'
      || ' order by rank desc, title asc\n'
      || ' limit ' || greatest(1, least(100, coalesce(max_results, 20)))
      || ' offset ' || greatest(0, coalesce(page_offset, 0));

  RETURN QUERY EXECUTE sql;
END;
$func$;

-- (Skipped for local replay: these GIN indexes call unaccent() in the index
-- expression, which this Postgres build doesn't mark IMMUTABLE, so
-- "functions in index expression must be marked IMMUTABLE" errors here.
-- They're a search performance optimization only — global_search() above
-- works fine without them, just unindexed. Safe to omit locally.)
COMMIT;