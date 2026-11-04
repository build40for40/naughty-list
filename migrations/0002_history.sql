CREATE TABLE evidence_history (
  evidence_id TEXT NOT NULL REFERENCES evidence(id),
  import_run_id TEXT NOT NULL REFERENCES import_runs(id),
  record_json TEXT NOT NULL CHECK(json_valid(record_json)),
  PRIMARY KEY(evidence_id, import_run_id)
);
