import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import pool from '../db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, u.name as user_name, u.email as user_email,
              d.month, d.year, d.draw_numbers
       FROM winners w
       JOIN users u ON u.id = w.user_id
       JOIN draws d ON d.id = w.draw_id
       WHERE d.status = 'published'
       ORDER BY w.created_at DESC`
    );
    res.json({ winners: result.rows });
  } catch (err) {
    console.error('Get winners error:', err);
    res.status(500).json({ error: 'Failed to fetch winners' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, d.month, d.year, d.draw_numbers
       FROM winners w
       JOIN draws d ON d.id = w.draw_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json({ winners: result.rows });
  } catch (err) {
    console.error('Get my winners error:', err);
    res.status(500).json({ error: 'Failed to fetch your winnings' });
  }
});

// Upload proof of score
router.post('/:id/upload-proof', authenticate, upload.single('proof'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const winner = await pool.query('SELECT * FROM winners WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (winner.rows.length === 0) return res.status(404).json({ error: 'Winner record not found' });
    const proofUrl = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      `UPDATE winners SET proof_url=$1, verification_status='submitted' WHERE id=$2 RETURNING *`,
      [proofUrl, req.params.id]
    );
    res.json({ winner: result.rows[0] });
  } catch (err) {
    console.error('Upload proof error:', err);
    res.status(500).json({ error: 'Failed to upload proof' });
  }
});

// Admin: verify/reject winner
router.put('/:id/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, payout_status } = req.body;
    const validStatuses = ['approved', 'rejected', 'pending', 'submitted'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const updates = [`verification_status = $1`];
    const values = [status];
    if (payout_status) {
      updates.push(`payout_status = $${values.length + 1}`);
      values.push(payout_status);
    }
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE winners SET ${updates.join(', ')} WHERE id=$${values.length} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Winner not found' });
    res.json({ winner: result.rows[0] });
  } catch (err) {
    console.error('Verify winner error:', err);
    res.status(500).json({ error: 'Failed to update winner' });
  }
});

export default router;
