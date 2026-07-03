-- Let admin assign an order to a specific employee for delivery, so staff
-- can filter to "my orders" and get notified when something new lands on
-- their list.
ALTER TABLE orders ADD COLUMN assigned_employee_id INTEGER REFERENCES employees(id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_employee ON orders (assigned_employee_id);
