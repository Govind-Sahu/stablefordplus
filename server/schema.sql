-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'subscriber',
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  charity_id INTEGER,
  charity_contribution_pct INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Golf scores table (max 5 per user, rolling)
CREATE TABLE IF NOT EXISTS golf_scores (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date_played DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Charities table
CREATE TABLE IF NOT EXISTS charities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  website_url TEXT,
  featured BOOLEAN DEFAULT false,
  events JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Draws table
CREATE TABLE IF NOT EXISTS draws (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  algorithm_type TEXT NOT NULL DEFAULT 'random',
  draw_numbers JSONB,
  prize_pool_total BIGINT DEFAULT 0,
  tier5_amount BIGINT DEFAULT 0,
  tier4_amount BIGINT DEFAULT 0,
  tier3_amount BIGINT DEFAULT 0,
  jackpot_carried_forward BOOLEAN DEFAULT false,
  jackpot_won BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  UNIQUE(month, year)
);

-- Draw entries (who won what)
CREATE TABLE IF NOT EXISTS draw_entries (
  id SERIAL PRIMARY KEY,
  draw_id INTEGER NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  numbers_matched INTEGER NOT NULL,
  prize_tier INTEGER NOT NULL,
  prize_amount BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Winners verification table
CREATE TABLE IF NOT EXISTS winners (
  id SERIAL PRIMARY KEY,
  draw_id INTEGER NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prize_tier INTEGER NOT NULL,
  prize_amount BIGINT DEFAULT 0,
  proof_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  payout_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_golf_scores_user_id ON golf_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_date ON golf_scores(date_played DESC);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
