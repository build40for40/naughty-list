PRAGMA foreign_keys = ON;
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  registry_json TEXT NOT NULL CHECK(json_valid(registry_json))
);
CREATE TABLE selectors (
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id),
  PRIMARY KEY(kind, value, company_id)
);
CREATE INDEX selectors_lookup ON selectors(kind, value);
CREATE TABLE company_relationships (
  child_id TEXT NOT NULL REFERENCES companies(id),
  parent_id TEXT NOT NULL REFERENCES companies(id),
  source_url TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  PRIMARY KEY(child_id, parent_id)
);
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config_json TEXT NOT NULL CHECK(json_valid(config_json)),
  last_success_at TEXT,
  last_attempt_at TEXT,
  last_error TEXT
);
CREATE TABLE import_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('running','succeeded','failed')),
  record_count INTEGER NOT NULL DEFAULT 0,
  error TEXT
);
CREATE TABLE evidence (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id),
  source_record_id TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id),
  publication_status TEXT NOT NULL CHECK(publication_status IN ('published','pending','withdrawn')),
  record_json TEXT NOT NULL CHECK(json_valid(record_json)),
  import_run_id TEXT REFERENCES import_runs(id),
  UNIQUE(source_id, source_record_id, company_id)
);
CREATE INDEX evidence_company ON evidence(company_id, publication_status);
