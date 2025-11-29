import { migrationRunner } from '@forge/sql';

export const CREATE_RESUME_TABLE = `
  CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(64) PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
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

const CREATE_EXPERIENCE_TABLE_ONLY = `
  CREATE TABLE IF NOT EXISTS experiences (
    id VARCHAR(64) PRIMARY KEY,
    resume_id VARCHAR(64) NOT NULL,
    company TEXT,
    position TEXT,
    working_period TEXT,
    job_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resume FOREIGN KEY (resume_id)
      REFERENCES resumes(id)
      ON DELETE CASCADE
  );
`;

const INDEX_EXPERIENCES = `
  CREATE INDEX IF NOT EXISTS idx_experiences_resume_id 
  ON experiences(resume_id);
`;

const CREATE_REFERRER_TABLE_ONLY = `
  CREATE TABLE IF NOT EXISTS referrers (
    id INT PRIMARY KEY AUTO_INCREMENT,
  resume_id VARCHAR(64) NOT NULL,      
  first_name TEXT,                     
  last_name TEXT,                      
  referrer_first_name TEXT,
  referrer_last_name TEXT,            
  user_story VARCHAR(128),             
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_referrer_resume FOREIGN KEY (resume_id)
    REFERENCES resumes(id)
    ON DELETE CASCADE
  );
`;

const INDEX_REFERRERS = `
  CREATE INDEX IF NOT EXISTS idx_referrers_resume_id 
  ON referrers(resume_id);
`;


// ------------------------- REPUTATION CATALOG TABLE -------------------------
const CREATE_REPUTATION_CATALOG_TABLE = `
  CREATE TABLE IF NOT EXISTS reputationcatalog (
    id INT PRIMARY KEY AUTO_INCREMENT,
    range_lowerpositive INTEGER,
    range_upperpositive INTEGER,
    positive_id INTEGER,
    positive_definition TEXT,
    positive_value INTEGER,
    range_lowernegative INTEGER,
    range_uppernegative INTEGER,
    negative_id INTEGER,
    negative_definition TEXT,
    negative_value INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const INDEX_REPUTATION_CATALOG = `
  CREATE INDEX IF NOT EXISTS idx_reputationcatalog_id 
  ON reputationcatalog(id);
`;

// ------------------------- ASSIGN REPUTATION TABLE -------------------------
const CREATE_ASSIGN_REPUTATION_TABLE = `
  CREATE TABLE IF NOT EXISTS assignreputation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resume_id VARCHAR(64),
    first_name TEXT,
    last_name TEXT,
    total_reputation_value INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignreputation_resume FOREIGN KEY (resume_id)
      REFERENCES resumes(id)
      ON DELETE SET NULL
  );
`;

const INDEX_ASSIGN_REPUTATION = `
  CREATE INDEX IF NOT EXISTS idx_assignreputation_resume_id 
  ON assignreputation(resume_id);
`;



const migrations = migrationRunner
  .enqueue('v_create_resumes', CREATE_RESUME_TABLE)

  .enqueue('v_create_experiences', CREATE_EXPERIENCE_TABLE_ONLY)
  .enqueue('v_index_experiences', INDEX_EXPERIENCES)

  .enqueue('v_create_referrers', CREATE_REFERRER_TABLE_ONLY)
  .enqueue('v_index_referrers', INDEX_REFERRERS)

  .enqueue('v_create_reputationcatalog', CREATE_REPUTATION_CATALOG_TABLE)
  .enqueue('v_index_reputationcatalog', INDEX_REPUTATION_CATALOG)
  .enqueue('v_create_assignreputation', CREATE_ASSIGN_REPUTATION_TABLE)
  .enqueue('v_index_assignreputation', INDEX_ASSIGN_REPUTATION);


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
