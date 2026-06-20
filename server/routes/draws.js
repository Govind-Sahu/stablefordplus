import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

function generateDrawNumbers(algorithm, scores) {
  if (algorithm === 'random') {
    const nums = new Set();
    while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(nums).sort((a, b) => a - b);
  }
  // Algorithmic: weighted by frequency of user scores
  const freq = {};
  scores.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
  const weighted = [];
  for (let n = 1; n <= 45; n++) {
    const weight = freq[n] ? freq[n] * 3 : 1;
    for (let i = 0; i < weight; i++) weighted.push(n);
  }
  const chosen = new Set();
  while (chosen.size < 5) {
    chosen.add(weighted[Math.floor(Math.random() * weighted.length)]);
  }
  return Array.from(chosen).sort((a, b) => a - b);
}

function countMatches(userScores, drawNumbers) {
  return userScores.filter(s => drawNumbers.includes(s)).length;
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM draw_entries de WHERE de.draw_id = d.id) as entry_count
       FROM draws d ORDER BY d.year DESC, d.month DESC LIMIT 20`
    );
    res.json({ draws: result.rows });
  } catch (err) {
    console.error('Get draws error:', err);
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

router.get('/current', async (req, res) => {
  try {
    const now = new Date();
    const result = await pool.query(
      `SELECT * FROM draws WHERE month = $1 AND year = $2 ORDER BY created_at DESC LIMIT 1`,
      [now.getMonth() + 1, now.getFullYear()]
    );
    res.json({ draw: result.rows[0] || null });
  } catch (err) {
    console.error('Get current draw error:', err);
    res.status(500).json({ error: 'Failed to fetch current draw' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const draw = await pool.query('SELECT * FROM draws WHERE id = $1', [req.params.id]);
    if (draw.rows.length === 0) return res.status(404).json({ error: 'Draw not found' });
    const entries = await pool.query(
      `SELECT de.*, u.name as user_name FROM draw_entries de
       JOIN users u ON u.id = de.user_id WHERE de.draw_id = $1`,
      [req.params.id]
    );
    res.json({ draw: draw.rows[0], entries: entries.rows });
  } catch (err) {
    console.error('Get draw error:', err);
    res.status(500).json({ error: 'Failed to fetch draw' });
  }
});

router.get('/:id/my-entry', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM draw_entries WHERE draw_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ entry: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// Admin: create draw
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { month, year, algorithm_type } = req.body;
    const now = new Date();
    const m = month || (now.getMonth() + 1);
    const y = year || now.getFullYear();
    const existing = await pool.query('SELECT id FROM draws WHERE month=$1 AND year=$2', [m, y]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Draw for this month already exists' });

    // Calculate prize pool from active subscribers
    const subCount = await pool.query(
      "SELECT COUNT(*) FROM users WHERE subscription_status = 'active'"
    );
    const count = parseInt(subCount.rows[0].count);
    const monthlyFee = 1999; // £19.99 in pence
    const poolPortion = 0.5; // 50% of subscription goes to prize pool
    const totalPool = count * monthlyFee * poolPortion;

    // Get previous jackpot if not won
    const prevDraw = await pool.query(
      `SELECT * FROM draws WHERE year = $1 AND month = $2 AND status = 'published'`,
      [m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1]
    );
    let jackpotCarried = 0;
    if (prevDraw.rows.length > 0 && prevDraw.rows[0].jackpot_carried_forward) {
      jackpotCarried = prevDraw.rows[0].tier5_amount;
    }

    const tier5 = Math.round(totalPool * 0.4) + jackpotCarried;
    const tier4 = Math.round(totalPool * 0.35);
    const tier3 = Math.round(totalPool * 0.25);

    const result = await pool.query(
      `INSERT INTO draws (month, year, status, algorithm_type, prize_pool_total, tier5_amount, tier4_amount, tier3_amount, jackpot_carried_forward, created_at)
       VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [m, y, algorithm_type || 'random', totalPool, tier5, tier4, tier3, jackpotCarried > 0]
    );
    res.status(201).json({ draw: result.rows[0] });
  } catch (err) {
    console.error('Create draw error:', err);
    res.status(500).json({ error: 'Failed to create draw' });
  }
});

// Admin: simulate / run draw
router.post('/:id/simulate', authenticate, requireAdmin, async (req, res) => {
  try {
    const draw = await pool.query('SELECT * FROM draws WHERE id=$1', [req.params.id]);
    if (draw.rows.length === 0) return res.status(404).json({ error: 'Draw not found' });
    const d = draw.rows[0];

    // Get all active subscriber scores
    const allScores = await pool.query(
      `SELECT gs.user_id, gs.score FROM golf_scores gs
       JOIN users u ON u.id = gs.user_id
       WHERE u.subscription_status = 'active'`
    );
    const scoreValues = allScores.rows.map(r => r.score);
    const drawNumbers = generateDrawNumbers(d.algorithm_type, scoreValues);

    // Evaluate entries
    const userScores = {};
    allScores.rows.forEach(r => {
      if (!userScores[r.user_id]) userScores[r.user_id] = [];
      userScores[r.user_id].push(r.score);
    });

    await pool.query('DELETE FROM draw_entries WHERE draw_id=$1', [d.id]);

    const entries = [];
    for (const [userId, scores] of Object.entries(userScores)) {
      const matches = countMatches(scores, drawNumbers);
      if (matches >= 3) {
        const tier = matches >= 5 ? 5 : matches >= 4 ? 4 : 3;
        entries.push({ userId, matches, tier });
      }
    }

    // Calculate prizes per winner per tier
    const tier5Winners = entries.filter(e => e.tier === 5).length;
    const tier4Winners = entries.filter(e => e.tier === 4).length;
    const tier3Winners = entries.filter(e => e.tier === 3).length;

    const jackpotWon = tier5Winners > 0;

    for (const entry of entries) {
      let prizeAmount = 0;
      if (entry.tier === 5) prizeAmount = tier5Winners > 0 ? Math.round(d.tier5_amount / tier5Winners) : 0;
      else if (entry.tier === 4) prizeAmount = tier4Winners > 0 ? Math.round(d.tier4_amount / tier4Winners) : 0;
      else if (entry.tier === 3) prizeAmount = tier3Winners > 0 ? Math.round(d.tier3_amount / tier3Winners) : 0;

      await pool.query(
        `INSERT INTO draw_entries (draw_id, user_id, numbers_matched, prize_tier, prize_amount, status)
         VALUES ($1,$2,$3,$4,$5,'pending')`,
        [d.id, entry.userId, entry.matches, entry.tier, prizeAmount]
      );
    }

    await pool.query(
      `UPDATE draws SET draw_numbers=$1, status='simulated', jackpot_won=$2 WHERE id=$3`,
      [JSON.stringify(drawNumbers), jackpotWon, d.id]
    );

    const updatedDraw = await pool.query('SELECT * FROM draws WHERE id=$1', [d.id]);
    res.json({
      draw: updatedDraw.rows[0],
      drawNumbers,
      summary: {
        tier5Winners,
        tier4Winners,
        tier3Winners,
        jackpotWon,
      }
    });
  } catch (err) {
    console.error('Simulate draw error:', err);
    res.status(500).json({ error: 'Failed to simulate draw' });
  }
});

// Admin: publish draw
router.post('/:id/publish', authenticate, requireAdmin, async (req, res) => {
  try {
    const draw = await pool.query('SELECT * FROM draws WHERE id=$1', [req.params.id]);
    if (draw.rows.length === 0) return res.status(404).json({ error: 'Draw not found' });
    if (draw.rows[0].status !== 'simulated') {
      return res.status(400).json({ error: 'Draw must be simulated before publishing' });
    }
    const d = draw.rows[0];

    // Create winner records for tier winners
    const entries = await pool.query(
      'SELECT * FROM draw_entries WHERE draw_id=$1 AND prize_tier >= 3',
      [d.id]
    );
    for (const entry of entries.rows) {
      const existing = await pool.query(
        'SELECT id FROM winners WHERE draw_id=$1 AND user_id=$2', [d.id, entry.user_id]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO winners (draw_id, user_id, prize_tier, prize_amount, verification_status, payout_status, created_at)
           VALUES ($1,$2,$3,$4,'pending','pending',NOW())`,
          [d.id, entry.user_id, entry.prize_tier, entry.prize_amount]
        );
      }
    }

    const jackpotCarriedForward = !d.jackpot_won;
    await pool.query(
      `UPDATE draws SET status='published', published_at=NOW(), jackpot_carried_forward=$1 WHERE id=$2`,
      [jackpotCarriedForward, d.id]
    );
    const updatedDraw = await pool.query('SELECT * FROM draws WHERE id=$1', [d.id]);
    res.json({ draw: updatedDraw.rows[0] });
  } catch (err) {
    console.error('Publish draw error:', err);
    res.status(500).json({ error: 'Failed to publish draw' });
  }
});

export default router;
