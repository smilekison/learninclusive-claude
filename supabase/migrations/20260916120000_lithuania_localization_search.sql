-- Drop the older 3-arg overload (search_query, max_results, page_offset)
-- from 20250809080006 — its third parameter has a DEFAULT, so any 2-arg
-- call is ambiguous against the 2-arg overload below ("is not unique",
-- discovered while testing this migration). The 2-arg version, from
-- 20250817082658 titled "Fix global_search function", is the intended one.
DROP FUNCTION IF EXISTS public.global_search(text, integer, integer);

-- Switch global_search()'s full-text search configuration from Finnish to
-- Lithuanian, as part of moving the product's target locale from Finland to
-- Lithuania. Postgres ships 'lithuanian' as a built-in text search config
-- (verified against this project's Postgres version), so this is a
-- like-for-like swap — same ranking/matching behavior, different language
-- stemming rules.
CREATE OR REPLACE FUNCTION public.global_search(q text, limit_count integer DEFAULT 10)
RETURNS TABLE(entity_type text, id uuid, title text, subtitle text, route text, rank real)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    -- Classes
    SELECT
      'class'::text as entity_type,
      c.id,
      c.name as title,
      coalesce(c.description, '') as subtitle,
      '/classes'::text as route,
      ts_rank(to_tsvector('lithuanian', coalesce(c.name,'') || ' ' || coalesce(c.description,'')), plainto_tsquery('lithuanian', q)) AS rank
    FROM classes c
    WHERE c.is_active = true
      AND to_tsvector('lithuanian', coalesce(c.name,'') || ' ' || coalesce(c.description,'')) @@ plainto_tsquery('lithuanian', q)

    UNION ALL

    -- Subjects
    SELECT
      'subject'::text as entity_type,
      s.id,
      s.name as title,
      coalesce(s.description,'') as subtitle,
      '/subjects'::text as route,
      ts_rank(to_tsvector('lithuanian', coalesce(s.name,'') || ' ' || coalesce(s.description,'')), plainto_tsquery('lithuanian', q)) AS rank
    FROM subjects s
    WHERE s.is_active = true
      AND to_tsvector('lithuanian', coalesce(s.name,'') || ' ' || coalesce(s.description,'')) @@ plainto_tsquery('lithuanian', q)

    UNION ALL

    -- Assignments
    SELECT
      'assignment'::text as entity_type,
      a.id,
      a.title as title,
      coalesce(a.description,'') as subtitle,
      '/assignments'::text as route,
      ts_rank(to_tsvector('lithuanian', coalesce(a.title,'') || ' ' || coalesce(a.description,'')), plainto_tsquery('lithuanian', q)) AS rank
    FROM assignments a
    WHERE coalesce(a.is_active, true) = true
      AND to_tsvector('lithuanian', coalesce(a.title,'') || ' ' || coalesce(a.description,'')) @@ plainto_tsquery('lithuanian', q)

    UNION ALL

    -- Profiles (teachers + students)
    SELECT
      'profile'::text as entity_type,
      p.id,
      trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) as title,
      coalesce(p.role::text,'') as subtitle,
      CASE WHEN p.role = 'teacher' THEN '/teachers' ELSE '/students' END as route,
      ts_rank(to_tsvector('lithuanian', trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) || ' ' || coalesce(p.role::text,'')), plainto_tsquery('lithuanian', q)) AS rank
    FROM profiles p
    WHERE coalesce(p.is_active, true) = true
      AND to_tsvector('lithuanian', trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) || ' ' || coalesce(p.role::text,'')) @@ plainto_tsquery('lithuanian', q)
  ) t
  ORDER BY rank DESC
  LIMIT limit_count;
$function$;
