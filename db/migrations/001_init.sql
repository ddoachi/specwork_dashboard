-- enums
DO $$ BEGIN
  CREATE TYPE spec_type AS ENUM ('epic','feature','task');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE spec_status AS ENUM ('draft','in_progress','done','blocked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE spec_priority AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE spec_effort AS ENUM ('tiny','small','medium','large','xl');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE spec_risk AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE spec_rel_type AS ENUM ('dependency','blocks','related');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- main
CREATE TABLE IF NOT EXISTS specs (
  id               varchar(32) PRIMARY KEY,
  title            text NOT NULL,
  type             spec_type NOT NULL,
  parent_id        varchar(32) REFERENCES specs(id) ON DELETE SET NULL,
  epic_id          varchar(32) REFERENCES specs(id) ON DELETE SET NULL,
  domain           text,

  status           spec_status NOT NULL DEFAULT 'draft',
  priority         spec_priority NOT NULL DEFAULT 'medium',

  created          date NOT NULL,
  updated          date NOT NULL,
  due_date         date,
  estimated_hours  int NOT NULL DEFAULT 0,
  actual_hours     int NOT NULL DEFAULT 0,

  context_file     text,

  effort           spec_effort,
  risk             spec_risk
);

-- tags
CREATE TABLE IF NOT EXISTS spec_tags (
  id    serial PRIMARY KEY,
  name  text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS spec_tag_map (
  spec_id varchar(32) REFERENCES specs(id) ON DELETE CASCADE,
  tag_id  int REFERENCES spec_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (spec_id, tag_id)
);

-- files / commits / PRs
CREATE TABLE IF NOT EXISTS spec_files (
  id      serial PRIMARY KEY,
  spec_id varchar(32) REFERENCES specs(id) ON DELETE CASCADE,
  path    text NOT NULL
);

CREATE TABLE IF NOT EXISTS spec_commits (
  id      serial PRIMARY KEY,
  spec_id varchar(32) REFERENCES specs(id) ON DELETE CASCADE,
  sha     varchar(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS spec_prs (
  id      serial PRIMARY KEY,
  spec_id varchar(32) REFERENCES specs(id) ON DELETE CASCADE,
  url     text NOT NULL
);

-- relationships: dependencies, blocks, related
CREATE TABLE IF NOT EXISTS spec_relations (
  from_id  varchar(32) REFERENCES specs(id) ON DELETE CASCADE,
  to_id    varchar(32) REFERENCES specs(id) ON DELETE CASCADE,
  rel_type spec_rel_type NOT NULL,
  PRIMARY KEY (from_id, to_id, rel_type),
  CHECK (from_id <> to_id)
);

-- helpful indexes
CREATE INDEX IF NOT EXISTS idx_specs_parent ON specs(parent_id);
CREATE INDEX IF NOT EXISTS idx_specs_epic   ON specs(epic_id);
CREATE INDEX IF NOT EXISTS idx_specs_status ON specs(status);
CREATE INDEX IF NOT EXISTS idx_specs_domain ON specs(domain);
CREATE INDEX IF NOT EXISTS idx_rel_from     ON spec_relations(from_id);
CREATE INDEX IF NOT EXISTS idx_rel_to       ON spec_relations(to_id);
