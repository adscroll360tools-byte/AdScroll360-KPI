-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'controller', 'employee');
CREATE TYPE task_status AS ENUM ('Pending', 'In Progress', 'Completed', 'Approved');
CREATE TYPE attendance_status AS ENUM ('Present', 'Late', 'Absent', 'On Leave', 'Break');


-- 1. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL, -- (Note: using plain text for demo, use Supabase Auth for production)
  role user_role DEFAULT 'employee',
  department TEXT,
  position TEXT,
  score INTEGER DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin
INSERT INTO users (email, name, password, role, department, position) 
VALUES ('basith@adscroll360.com', 'Basith', 'password', 'admin', 'Management', 'Core Admin');


-- 2. TASKS TABLE
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status task_status DEFAULT 'Pending',
  date TEXT NOT NULL,
  deadline TEXT,
  time_spent TEXT DEFAULT '0m',
  notes TEXT,
  assignee_id TEXT, -- User ID (string in code)
  assigned_by_id TEXT,
  kpi_relation_id TEXT,
  type TEXT DEFAULT 'Individual', -- 'Individual' or 'Group'
  messages JSONB DEFAULT '[]',
  submission JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 2.1 KPIS TABLE
CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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


-- 2.2 QUALITY METRICS & SCORES
CREATE TABLE quality_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric TEXT NOT NULL,
  weight INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  breakdown JSONB NOT NULL,
  month TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 3. REWARDS TABLE
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'Pending', -- 'Pending' or 'Awarded'
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. SKILLS TABLE
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 5. ATTENDANCE TABLE
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status DEFAULT 'Present',
  check_in_time TEXT DEFAULT '—',
  check_out_time TEXT DEFAULT '—',
  break_start_time TEXT,
  break_end_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- Ensure one attendance record per user per day
);


-- 5.1 BREAK REQUESTS TABLE
CREATE TABLE break_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  reason TEXT NOT NULL,
  session_time TEXT NOT NULL,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 6. STANDUPS TABLE
CREATE TABLE standups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
