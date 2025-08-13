-- Composite covering index for hot read pattern
CREATE INDEX IF NOT EXISTS events_tenant_ts_cover
  ON events (tenant_id, ts DESC) INCLUDE (kind, user_id);
