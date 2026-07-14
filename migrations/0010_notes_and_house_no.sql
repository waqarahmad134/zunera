-- Optional free-text notes on every CRUD entity, for anything that doesn't
-- fit a structured field. Customers also get a separate house/unit number,
-- distinct from the full address text (can hold any free-form value —
-- "12-B", "Flat 4, 2nd Floor", etc.).
ALTER TABLE orders ADD COLUMN notes TEXT;
ALTER TABLE customers ADD COLUMN notes TEXT;
ALTER TABLE customers ADD COLUMN house_no TEXT;
ALTER TABLE employees ADD COLUMN notes TEXT;
ALTER TABLE expenses ADD COLUMN notes TEXT;
