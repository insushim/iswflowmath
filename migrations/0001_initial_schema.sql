-- ============================================================
-- 셈마루(SemMaru) - D1 Database Schema
-- Firestore → D1 마이그레이션
-- ============================================================

-- 사용자 프로필
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- Firebase UID
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  grade INTEGER NOT NULL DEFAULT 7,       -- 1-12
  subscription_tier TEXT NOT NULL DEFAULT 'free', -- free | basic | premium
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  theta REAL NOT NULL DEFAULT 0,          -- IRT 능력 파라미터 (-3 ~ +3)
  streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date TEXT,                -- YYYY-MM-DD
  streak_start_date TEXT,
  total_active_days INTEGER NOT NULL DEFAULT 0,
  activity_dates TEXT DEFAULT '[]',       -- JSON array of YYYY-MM-DD strings
  last_practice_date TEXT,
  diagnostic_completed INTEGER NOT NULL DEFAULT 0, -- boolean
  diagnostic_result TEXT,                 -- JSON
  estimated_level INTEGER,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  perfect_sessions INTEGER NOT NULL DEFAULT 0,
  flow_states INTEGER NOT NULL DEFAULT 0,
  fast_solves INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  average_accuracy REAL NOT NULL DEFAULT 0,
  achievements TEXT DEFAULT '[]',         -- JSON array of achievement IDs
  achievement_history TEXT DEFAULT '[]',  -- JSON array of {achievementId, unlockedAt}
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 학습 세션
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  problems_attempted INTEGER NOT NULL DEFAULT 0,
  problems_correct INTEGER NOT NULL DEFAULT 0,
  initial_theta REAL NOT NULL DEFAULT 0,
  final_theta REAL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  flow_percentage REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_started ON sessions(user_id, started_at DESC);

-- 문제 풀이 기록
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  problem_content TEXT NOT NULL,
  problem_irt TEXT NOT NULL DEFAULT '{}',  -- JSON: {a, b, c}
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,   -- boolean
  time_spent_ms INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  theta_before REAL NOT NULL DEFAULT 0,
  theta_after REAL NOT NULL DEFAULT 0,
  flow_state TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_session_id ON attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);

-- 업적
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- 일별 통계
CREATE TABLE IF NOT EXISTS daily_stats (
  id TEXT PRIMARY KEY,                     -- userId_YYYY-MM-DD
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,                      -- YYYY-MM-DD
  problems_solved INTEGER NOT NULL DEFAULT 0,
  problems_correct INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  topics_practiced TEXT DEFAULT '[]',      -- JSON array of topic strings
  flow_percentage REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date DESC);

-- 몰입 문제
CREATE TABLE IF NOT EXISTS immersion_problems (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,                -- 5min | 10min | 30min | 1hour | 1day | 3days | 7days | 1month
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  hints TEXT NOT NULL DEFAULT '[]',        -- JSON array of strings
  solution TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned', -- assigned | in_progress | completed | skipped
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  user_answer TEXT,
  is_correct INTEGER,                      -- boolean
  time_spent_minutes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_immersion_user_id ON immersion_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_immersion_user_status ON immersion_problems(user_id, difficulty, status);

-- XP 히스토리
CREATE TABLE IF NOT EXISTS xp_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  previous_xp INTEGER NOT NULL DEFAULT 0,
  new_xp INTEGER NOT NULL DEFAULT 0,
  leveled_up INTEGER NOT NULL DEFAULT 0,   -- boolean
  previous_level INTEGER NOT NULL DEFAULT 1,
  new_level INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);
