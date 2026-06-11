import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const plans = db.prepare('SELECT * FROM plans ORDER BY price ASC').all();
  res.json(plans);
});

router.get('/:id', (req, res) => {
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  
  if (!plan) {
    res.status(404).json({ error: '方案不存在' });
    return;
  }

  res.json(plan);
});

export default router;
