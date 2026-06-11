import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { category, search } = req.query;
  
  let query = 'SELECT * FROM snacks WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  const snacks = db.prepare(query).all(...params);
  res.json(snacks);
});

router.get('/:id', (req, res) => {
  const snack = db.prepare('SELECT * FROM snacks WHERE id = ?').get(req.params.id);
  
  if (!snack) {
    res.status(404).json({ error: '零食不存在' });
    return;
  }

  const ratings = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.snack_id = ?
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all(req.params.id);

  const avgRating = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count
    FROM ratings WHERE snack_id = ?
  `).get(req.params.id);

  res.json({
    ...snack,
    ratings,
    avg_rating: avgRating,
  });
});

export default router;
