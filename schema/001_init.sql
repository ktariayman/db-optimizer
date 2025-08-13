CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id   BIGINT NOT NULL,
  ts        TIMESTAMPTZ NOT NULL,
  kind      TEXT NOT NULL,
  payload   JSONB NOT NULL
);

-- Baseline indexes (minimal, we will iterate later)
CREATE INDEX IF NOT EXISTS events_tenant_ts ON events (tenant_id, ts DESC);
CREATE INDEX IF NOT EXISTS events_user_ts   ON events (user_id, ts DESC);
