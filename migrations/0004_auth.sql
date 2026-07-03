-- Portal/staff login: customers and employees can optionally get a password
-- set by the admin, which enables them to log in and see their own scoped
-- view. Phone is the login identifier — already present on both tables.
ALTER TABLE customers ADD COLUMN password_hash TEXT;
ALTER TABLE employees ADD COLUMN password_hash TEXT;
