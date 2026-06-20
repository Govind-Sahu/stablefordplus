import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [users, activeUsers, totalPool, charities, draws, winners, pending] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM users WHERE subscription_status = 'active'"),
      pool.query("SELECT COALESCE(SUM(prize_pool_total),0) as total FROM draws WHERE status = 'published'"),
      pool.query('SELECT COUNT(*) FROM charities WHERE active=true'),
      pool.query('SELECT COUNT(*) FROM draws'),
      pool.query("SELECT COUNT(*) FROM winners WHERE verification_status='approved'"),
      pool.query("SELECT COUNT(*) FROM winners WHERE verification_status='submitted'"),
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      activeSubscribers: parseInt(activeUsers.rows[0].count),
      totalPrizePool: parseInt(totalPool.rows[0].total),
      totalCharities: parseInt(charities.rows[0].count),
      totalDraws: parseInt(draws.rows[0].count),
      verifiedWinners: parseInt(winners.rows[0].count),
      pendingVerification: parseInt(pending.rows[0].count),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `SELECT u.id, u.email, u.name, u.role, u.subscription_status,
                        u.charity_id, u.charity_contribution_pct, u.created_at,
                        c.name as charity_name,
                        (SELECT COUNT(*) FROM golf_scores gs WHERE gs.user_id=u.id) as score_count
                 FROM users u
                 LEFT JOIN charities c ON c.id = u.charity_id`;
    const values = [];
    const conditions = [];
    let idx = 1;
    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }
    if (status) {
      conditions.push(`u.subscription_status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY u.created_at DESC';
    const result = await pool.query(query, values);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.*, c.name as charity_name FROM users u
       LEFT JOIN charities c ON c.id = u.charity_id WHERE u.id=$1`,
      [req.params.id]
    );
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const scores = await pool.query(
      'SELECT * FROM golf_scores WHERE user_id=$1 ORDER BY date_played DESC',
      [req.params.id]
    );
    res.json({ user: user.rows[0], scores: scores.rows });
  } catch (err) {
    console.error('Admin get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, role, subscription_status, charity_id, charity_contribution_pct } = req.body;
    const result = await pool.query(
      `UPDATE users SET name=$1, role=$2, subscription_status=$3, charity_id=$4, charity_contribution_pct=$5
       WHERE id=$6 RETURNING id, email, name, role, subscription_status, charity_id, charity_contribution_pct`,
      [name, role, subscription_status, charity_id, charity_contribution_pct, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id/scores/:scoreId', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM golf_scores WHERE id=$1 AND user_id=$2', [req.params.scoreId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete score' });
  }
});

router.get('/winners', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, u.name as user_name, u.email as user_email,
              d.month, d.year, d.draw_numbers
       FROM winners w
       JOIN users u ON u.id = w.user_id
       JOIN draws d ON d.id = w.draw_id
       ORDER BY w.created_at DESC`
    );
    res.json({ winners: result.rows });
  } catch (err) {
    console.error('Admin winners error:', err);
    res.status(500).json({ error: 'Failed to fetch winners' });
  }
});

router.get('/charity-contributions', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name,
              COUNT(u.id) as supporter_count,
              COALESCE(SUM(
                CASE WHEN u.subscription_status='active' THEN
                  1999 * (u.charity_contribution_pct::float / 100)
                ELSE 0 END
              ), 0) as monthly_contribution
       FROM charities c
       LEFT JOIN users u ON u.charity_id = c.id
       WHERE c.active=true
       GROUP BY c.id, c.name
       ORDER BY monthly_contribution DESC`
    );
    res.json({ contributions: result.rows });
  } catch (err) {
    console.error('Charity contributions error:', err);
    res.status(500).json({ error: 'Failed to fetch charity contributions' });
  }
});

export default router;
