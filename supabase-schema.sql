-- Stableford+ Database Schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'subscriber',
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'inactive',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  charity_id INTEGER,
  charity_contribution_pct INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Golf Scores (rolling 5 max per user)
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date_played DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Charities
CREATE TABLE IF NOT EXISTS charities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly Draws
CREATE TABLE IF NOT EXISTS draws (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  draw_numbers JSONB,
  prize_pool_total INTEGER NOT NULL DEFAULT 0,
  tier5_amount INTEGER NOT NULL DEFAULT 0,
  tier4_amount INTEGER NOT NULL DEFAULT 0,
  tier3_amount INTEGER NOT NULL DEFAULT 0,
  jackpot_carried_forward BOOLEAN NOT NULL DEFAULT false,
  algorithm_type VARCHAR(50) NOT NULL DEFAULT 'random',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Draw Entries (one per user per draw)
CREATE TABLE IF NOT EXISTS draw_entries (
  id SERIAL PRIMARY KEY,
  draw_id INTEGER NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  numbers_used JSONB NOT NULL,
  numbers_matched INTEGER NOT NULL DEFAULT 0,
  prize_tier INTEGER,
  prize_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- Winners
CREATE TABLE IF NOT EXISTS winners (
  id SERIAL PRIMARY KEY,
  draw_id INTEGER NOT NULL REFERENCES draws(id),
  user_id UUID NOT NULL REFERENCES users(id),
  prize_tier INTEGER NOT NULL,
  prize_amount INTEGER NOT NULL DEFAULT 0,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payout_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_golf_scores_user_id ON golf_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Seed: Admin user (password: Admin@2024!)
-- bcrypt hash of "Admin@2024!"
INSERT INTO users (name, email, password_hash, role, subscription_status)
VALUES (
  'Admin',
  'admin@stableford.com',
  '$2a$10$xJ2Xv0kqBLO7KjMbTZiCuOKkYCLiTJ.DwCF7sUGLxFRqOKPB.kq3m',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Seed: Charities
INSERT INTO charities (name, description, image_url, website_url, featured) VALUES
('Cancer Research UK',
 'We are Cancer Research UK, the world''s leading cancer charity dedicated to saving lives through research.',
 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80',
 'https://www.cancerresearchuk.org', true),
('MacMillan Cancer Support',
 'Macmillan Cancer Support improves the lives of people living with cancer. We provide physical, financial and emotional support.',
 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
 'https://www.macmillan.org.uk', true),
('British Heart Foundation',
 'The BHF funds over £100m of research each year into heart and circulatory diseases and the conditions that cause them.',
 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=800&q=80',
 'https://www.bhf.org.uk', false),
('Mind',
 'Mind provides advice and support to empower anyone experiencing a mental health problem.',
 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
 'https://www.mind.org.uk', false),
('Save the Children',
 'Save the Children fights for children''s rights and delivers immediate and lasting improvements to children''s lives worldwide.',
 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
 'https://www.savethechildren.org.uk', false),
('Age UK',
 'Age UK is the UKs largest charity helping older people. We provide love, support and opportunities for later life.',
 'https://images.unsplash.com/photo-1447452001526-851947a8fd2e?w=800&q=80',
 'https://www.ageuk.org.uk', false)
ON CONFLICT DO NOTHING;
