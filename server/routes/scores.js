import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, score, date_played, created_at FROM golf_scores
       WHERE user_id = $1 ORDER BY date_played DESC LIMIT 5`,
      [req.user.id]
    );
    res.json({ scores: result.rows });
  } catch (err) {
    console.error('Get scores error:', err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { score, date_played } = req.body;
    if (!score || !date_played) {
      return res.status(400).json({ error: 'Score and date are required' });
    }
    const s = Number(score);
    if (isNaN(s) || s < 1 || s > 45) {
      return res.status(400).json({ error: 'Score must be between 1 and 45 (Stableford format)' });
    }
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM golf_scores WHERE user_id = $1',
      [req.user.id]
    );
    const count = parseInt(countResult.rows[0].count);
    if (count >= 5) {
      const oldest = await pool.query(
        'SELECT id FROM golf_scores WHERE user_id = $1 ORDER BY date_played ASC LIMIT 1',
        [req.user.id]
      );
      await pool.query('DELETE FROM golf_scores WHERE id = $1', [oldest.rows[0].id]);
    }
    const result = await pool.query(
      `INSERT INTO golf_scores (user_id, score, date_played, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, score, date_played, created_at`,
      [req.user.id, s, date_played]
    );
    res.status(201).json({ score: result.rows[0] });
  } catch (err) {
    console.error('Add score error:', err);
    res.status(500).json({ error: 'Failed to add score' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { score, date_played } = req.body;
    const s = Number(score);
    if (isNaN(s) || s < 1 || s > 45) {
      return res.status(400).json({ error: 'Score must be between 1 and 45' });
    }
    const result = await pool.query(
      `UPDATE golf_scores SET score = $1, date_played = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, score, date_played, created_at`,
      [s, date_played, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Score not found' });
    res.json({ score: result.rows[0] });
  } catch (err) {
    console.error('Update score error:', err);
    res.status(500).json({ error: 'Failed to update score' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM golf_scores WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Score not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete score error:', err);
    res.status(500).json({ error: 'Failed to delete score' });
  }
});

export default router;
