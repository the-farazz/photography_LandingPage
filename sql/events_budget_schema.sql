-- =========================================================================
-- FS VISUALS - EVENT BOOKINGS & PAYMENT TRACKING SCHEMA
-- =========================================================================

-- 1. Table for Event Bookings & Revenue
CREATE TABLE IF NOT EXISTS event_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  event_title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_location TEXT,
  service_type TEXT,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PARTIALLY PAID', -- 'FULLY PAID', 'PARTIALLY PAID', 'UNPAID'
  invoice_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for Detailed Payment Logs (Installments / Remaining Payments)
CREATE TABLE IF NOT EXISTS event_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES event_bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'Cash', -- 'Cash', 'Bank Transfer', 'EasyPaisa', 'JazzCash', 'Other'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for Fast Filtering by Date & Status
CREATE INDEX IF NOT EXISTS idx_event_bookings_date ON event_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_payments_event_id ON event_payments(event_id);

-- 4. Enable Row Level Security (RLS) & Allow Read/Write for Authenticated / Anon
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to event_bookings"
  ON event_bookings FOR SELECT USING (true);

CREATE POLICY "Allow public insert to event_bookings"
  ON event_bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to event_bookings"
  ON event_bookings FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to event_bookings"
  ON event_bookings FOR DELETE USING (true);

CREATE POLICY "Allow public read access to event_payments"
  ON event_payments FOR SELECT USING (true);

CREATE POLICY "Allow public insert to event_payments"
  ON event_payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete to event_payments"
  ON event_payments FOR DELETE USING (true);
