-- Fix PL/pgSQL variable/column name clash (year_suffix) in reference generator.
CREATE OR REPLACE FUNCTION generate_complaint_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  year_key text := to_char(timezone('UTC', now()), 'YY');
  seq bigint;
BEGIN
  INSERT INTO complaint_reference_counters AS counters (year_suffix, next_value, updated_at)
  VALUES (year_key, 1, timezone('UTC', now()))
  ON CONFLICT (year_suffix) DO UPDATE
    SET next_value = counters.next_value + 1,
        updated_at = timezone('UTC', now())
  RETURNING next_value INTO seq;

  IF seq > 999999 THEN
    RAISE EXCEPTION 'complaint_reference_exhausted_for_year_%', year_key;
  END IF;

  RETURN 'KP-' || year_key || '-' || lpad(seq::text, 6, '0');
END;
$$;
