-- Explicit enrolment keeps community voting scoped to reviewed launch brands.
CREATE TABLE community_brands (
  company_id TEXT PRIMARY KEY REFERENCES companies(id),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1))
);
CREATE TABLE community_votes (
  company_id TEXT NOT NULL REFERENCES community_brands(company_id),
  user_id TEXT NOT NULL,
  choice TEXT NOT NULL CHECK(choice IN ('nice','naughty','unsure')),
  reasons_json TEXT NOT NULL CHECK(json_valid(reasons_json)),
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  excluded INTEGER NOT NULL DEFAULT 0 CHECK(excluded IN (0,1)),
  PRIMARY KEY(company_id, user_id)
);
CREATE INDEX community_votes_summary ON community_votes(company_id, excluded, expires_at, choice);
CREATE INDEX community_votes_activity ON community_votes(company_id, updated_at);
CREATE TABLE community_rate_limits (
  user_id TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);
CREATE TABLE community_review_flags (
  company_id TEXT NOT NULL REFERENCES community_brands(company_id),
  window_start INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed')),
  PRIMARY KEY(company_id, window_start)
);
CREATE TABLE community_moderation (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('exclude','restore')),
  reason TEXT NOT NULL CHECK(reason IN ('spam','automation','coordinated_manipulation','review_correction')),
  created_at TEXT NOT NULL
);
