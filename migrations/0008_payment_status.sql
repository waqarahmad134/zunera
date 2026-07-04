-- Payment tracking per order: 'unpaid' until marked otherwise, with a
-- method ('cash' | 'online'). Both admin and staff can set it, but staff
-- get exactly one change each to payment_status and to status — once an
-- employee sets one, its *_locked_by_employee flag stops any employee from
-- changing it again (admin is never restricted by these flags).
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN status_locked_by_employee INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_locked_by_employee INTEGER NOT NULL DEFAULT 0;
