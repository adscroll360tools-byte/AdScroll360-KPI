-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
-- We use 'DROP TYPE IF EXISTS ... CASCADE' to allow re-running the script
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'controller', 'employee');

DROP TYPE IF EXISTS task_status CASCADE;
CREATE TYPE task_status AS ENUM ('Pending', 'In Progress', 'Completed', 'Approved');

DROP TYPE IF EXISTS attendance_status CASCADE;
CREATE TYPE attendance_status AS ENUM ('Present', 'Late', 'Absent', 'On Leave', 'Break');

-- 1. USERS TABLE
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role user_role DEFAULT 'employee',
  department TEXT,
  position TEXT,
  score INTEGER DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin
INSERT INTO users (id, email, name, password, role, department, position) 
VALUES ('admin-001', 'basith@adscroll360.com', 'Basith', 'AAAAAAAAAA@123456789', 'admin', 'Management', 'Core Admin');

-- 2. TASKS TABLE
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status task_status DEFAULT 'Pending',
  date TEXT,
  deadline TEXT,
  time_spent TEXT DEFAULT '0m',
  notes TEXT,
  assignee_id TEXT, -- User ID
  assigned_by_id TEXT,
  kpi_relation_id TEXT,
  type TEXT DEFAULT 'Individual',
  messages JSONB DEFAULT '[]',
  submission JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. KPIS TABLE
DROP TABLE IF EXISTS kpis CASCADE;
CREATE TABLE kpis (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'Company', 'Group', 'Individual'
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  unit TEXT NOT NULL,
  daily_min INTEGER,
  daily_max INTEGER,
  assigned_to_id TEXT,
  group_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. QUALITY METRICS & SCORES
DROP TABLE IF EXISTS quality_metrics CASCADE;
CREATE TABLE quality_metrics (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  metric TEXT NOT NULL,
  weight INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS quality_scores CASCADE;
CREATE TABLE quality_scores (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  employee_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  breakdown JSONB NOT NULL,
  month TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ATTENDANCE TABLE
DROP TABLE IF EXISTS attendance CASCADE;
CREATE TABLE attendance (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status DEFAULT 'Present',
  check_in_time TEXT DEFAULT '—',
  check_out_time TEXT DEFAULT '—',
  break_start_time TEXT,
  break_end_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 6. BREAK REQUESTS TABLE
DROP TABLE IF EXISTS break_requests CASCADE;
CREATE TABLE break_requests (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  reason TEXT NOT NULL,
  session_time TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. REWARDS TABLE
DROP TABLE IF EXISTS rewards CASCADE;
CREATE TABLE rewards (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SKILLS TABLE
DROP TABLE IF EXISTS skills CASCADE;
CREATE TABLE skills (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. STANDUPS TABLE
DROP TABLE IF EXISTS standups CASCADE;
CREATE TABLE standups (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  yesterday TEXT NOT NULL,
  today TEXT NOT NULL,
  blockers TEXT DEFAULT 'None',
  submitted_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) but set to full access for now (demo mode)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all access to rewards" ON rewards FOR ALL USING (true);
CREATE POLICY "Allow all access to skills" ON skills FOR ALL USING (true);
CREATE POLICY "Allow all access to attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow all access to standups" ON standups FOR ALL USING (true);
CREATE POLICY "Allow all access to break_requests" ON break_requests FOR ALL USING (true);
CREATE POLICY "Allow all access to kpis" ON kpis FOR ALL USING (true);
CREATE POLICY "Allow all access to quality_metrics" ON quality_metrics FOR ALL USING (true);
CREATE POLICY "Allow all access to quality_scores" ON quality_scores FOR ALL USING (true);
