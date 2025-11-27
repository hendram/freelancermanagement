import { migrationRunner } from '@forge/sql';

export const DROP_OLD_TABLES = `
  -- drop child tables first to avoid FK constraint issues
  DROP TABLE IF EXISTS experiences;
  DROP TABLE IF EXISTS referrers;
  DROP TABLE IF EXISTS reputations;
  DROP TABLE IF EXISTS resumes;
`;

export const CREATE_RESUME_TABLE = `
  CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(64) PRIMARY KEY,
    full_name TEXT,
    date_of_birth TEXT,
    place_of_birth TEXT,
    address TEXT,
    religion TEXT,
    contact TEXT,
    email TEXT,
    nationality TEXT,
    github TEXT,
    skills TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_EXPERIENCE_TABLE = `
  CREATE TABLE IF NOT EXISTS experiences (
    id VARCHAR(64) PRIMARY KEY,
    resume_id VARCHAR(64) NOT NULL,
    company TEXT,
    position TEXT,
    working_period TEXT,
    job_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resume
      FOREIGN KEY (resume_id)
      REFERENCES resumes(id)
      ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_experiences_resume_id ON experiences(resume_id);
`;

export const CREATE_REFERRER_TABLE = `
  CREATE TABLE IF NOT EXISTS referrers (
    id VARCHAR(64) PRIMARY KEY,
    resume_id VARCHAR(64) NOT NULL,
    referrer_name TEXT,
    referrer_contact TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_referrer_resume
      FOREIGN KEY (resume_id)
      REFERENCES resumes(id)
      ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_referrers_resume_id ON referrers(resume_id);
`;

export const CREATE_REPUTATION_TABLE = `
  CREATE TABLE IF NOT EXISTS reputations (
    id VARCHAR(64) PRIMARY KEY,
    resume_id VARCHAR(64) NOT NULL,
    score INTEGER,
    source TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reputation_resume
      FOREIGN KEY (resume_id)
      REFERENCES resumes(id)
      ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_reputations_resume_id ON reputations(resume_id);
`;

const migrations = migrationRunner
  .enqueue('v_drop_old_tables', DROP_OLD_TABLES)
  .enqueue('v_create_resumes', CREATE_RESUME_TABLE)
  .enqueue('v_create_experiences', CREATE_EXPERIENCE_TABLE)
  .enqueue('v_create_referrers', CREATE_REFERRER_TABLE)
  .enqueue('v_create_reputations', CREATE_REPUTATION_TABLE);

export const runSchemaMigration = async () => {
  try {
    await migrations.run();
    return getHttpResponse(200, 'Migrations successfully executed');
  } catch (e) {
    console.error('Migration error:', e);
    return getHttpResponse(500, 'Error while executing migrations');
  }
};

function getHttpResponse(statusCode, body) {
  return {
    headers: { 'Content-Type': ['application/json'] },
    statusCode,
    statusText: statusCode === 200 ? 'Ok' : 'Bad Request',
    body,
  };
}
