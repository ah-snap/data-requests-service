CREATE TYPE request_status AS ENUM (
  'Pending',
  'In Progress',
  'Complete',
  'Confirmed',
  'Declined'
);

CREATE TABLE IF NOT EXISTS requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        VARCHAR(255)   NOT NULL,
  data        TEXT           NOT NULL,
  requestor   VARCHAR(255)   NOT NULL,
  status      request_status NOT NULL DEFAULT 'Pending',
  notes       TEXT,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
