CREATE TABLE IF NOT EXISTS resumes (
  id VARCHAR(64) PRIMARY KEY,
  freelancer_id VARCHAR(255),
  full_name TEXT,
  bio TEXT,
  experience TEXT,
  skills TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
