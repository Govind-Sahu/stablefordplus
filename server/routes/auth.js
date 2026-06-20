import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, charity_contribution_pct, created_at)
       VALUES ($1, $2, $3, $4, 'subscriber', 10, NOW())
       RETURNING id, email, name, role, subscription_status, charity_id, charity_contribution_pct, created_at`,
      [id, email.toLowerCase().trim(), passwordHash, name]
    );
    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await pool.query(
      `SELECT id, email, name, role, password_hash, subscription_status, stripe_customer_id, stripe_subscription_id, charity_id, charity_contribution_pct, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, subscription_status, stripe_customer_id, stripe_subscription_id,
              charity_id, charity_contribution_pct, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, charity_id, charity_contribution_pct } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;
    if (name) { updates.push(`name = $${idx++}`); values.push(name); }
    if (charity_id !== undefined) { updates.push(`charity_id = $${idx++}`); values.push(charity_id); }
    if (charity_contribution_pct !== undefined) {
      const pct = Math.max(10, Math.min(100, Number(charity_contribution_pct)));
      updates.push(`charity_contribution_pct = $${idx++}`);
      values.push(pct);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING id, email, name, role, subscription_status, charity_id, charity_contribution_pct`,
      values
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
