import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search, featured } = req.query;
    let query = 'SELECT * FROM charities WHERE active = true';
    const values = [];
    let idx = 1;
    if (search) {
      query += ` AND (name ILIKE $${idx} OR description ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }
    if (featured === 'true') {
      query += ` AND featured = true`;
    }
    query += ' ORDER BY featured DESC, name ASC';
    const result = await pool.query(query, values);
    res.json({ charities: result.rows });
  } catch (err) {
    console.error('Get charities error:', err);
    res.status(500).json({ error: 'Failed to fetch charities' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM charities WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Charity not found' });
    res.json({ charity: result.rows[0] });
  } catch (err) {
    console.error('Get charity error:', err);
    res.status(500).json({ error: 'Failed to fetch charity' });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, website_url, featured, events } = req.body;
    if (!name || !description) return res.status(400).json({ error: 'Name and description are required' });
    const result = await pool.query(
      `INSERT INTO charities (name, description, image_url, website_url, featured, events, active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) RETURNING *`,
      [name, description, image_url || null, website_url || null, featured || false, JSON.stringify(events || [])]
    );
    res.status(201).json({ charity: result.rows[0] });
  } catch (err) {
    console.error('Create charity error:', err);
    res.status(500).json({ error: 'Failed to create charity' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, website_url, featured, events, active } = req.body;
    const result = await pool.query(
      `UPDATE charities SET name=$1, description=$2, image_url=$3, website_url=$4, featured=$5, events=$6, active=$7
       WHERE id=$8 RETURNING *`,
      [name, description, image_url, website_url, featured, JSON.stringify(events || []), active !== false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Charity not found' });
    res.json({ charity: result.rows[0] });
  } catch (err) {
    console.error('Update charity error:', err);
    res.status(500).json({ error: 'Failed to update charity' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE charities SET active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete charity error:', err);
    res.status(500).json({ error: 'Failed to delete charity' });
  }
});

export default router;
