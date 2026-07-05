-- Optional default rate-per-bottle for a customer, so it can prefill (and
-- still be overridden) on any new order for them instead of retyping it
-- every time.
ALTER TABLE customers ADD COLUMN default_rate_per_bottle REAL;
