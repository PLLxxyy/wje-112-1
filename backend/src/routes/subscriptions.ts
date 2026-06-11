import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const subscriptions = db.prepare(`
    SELECT s.*, p.name as plan_name, p.description as plan_description, p.price, p.snacks_count
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `).all(req.user!.id);

  res.json(subscriptions);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { plan_id } = req.body;

  if (!plan_id) {
    res.status(400).json({ error: '请选择订阅方案' });
    return;
  }

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(plan_id) as any;
  if (!plan) {
    res.status(404).json({ error: '方案不存在' });
    return;
  }

  const activeSub = db.prepare(
    "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'"
  ).get(req.user!.id);

  if (activeSub) {
    res.status(400).json({ error: '您已有有效的订阅，请先取消或更换方案' });
    return;
  }

  const subscriptionId = uuidv4();
  const now = new Date();
  const nextShipDate = new Date(now);
  nextShipDate.setMonth(nextShipDate.getMonth() + 1);
  nextShipDate.setDate(5);

  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, start_date, next_ship_date)
    VALUES (?, ?, ?, 'active', ?, ?)
  `).run(
    subscriptionId,
    req.user!.id,
    plan_id,
    now.toISOString(),
    nextShipDate.toISOString()
  );

  const subscription = db.prepare(`
    SELECT s.*, p.name as plan_name, p.price, p.snacks_count
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.id = ?
  `).get(subscriptionId);

  res.status(201).json(subscription);
});

router.post('/:id/pause', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const subscription = db.prepare(
    'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id) as any;

  if (!subscription) {
    res.status(404).json({ error: '订阅不存在' });
    return;
  }

  if (subscription.status !== 'active') {
    res.status(400).json({ error: '该订阅无法暂停' });
    return;
  }

  db.prepare(
    "UPDATE subscriptions SET status = 'paused', pause_reason = ? WHERE id = ?"
  ).run(reason || '', id);

  const updated = db.prepare(`
    SELECT s.*, p.name as plan_name, p.price, p.snacks_count
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.id = ?
  `).get(id);

  res.json(updated);
});

router.post('/:id/resume', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;

  const subscription = db.prepare(
    'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id) as any;

  if (!subscription) {
    res.status(404).json({ error: '订阅不存在' });
    return;
  }

  if (subscription.status !== 'paused') {
    res.status(400).json({ error: '该订阅无法续订' });
    return;
  }

  const nextShipDate = new Date();
  nextShipDate.setMonth(nextShipDate.getMonth() + 1);
  nextShipDate.setDate(5);

  db.prepare(
    "UPDATE subscriptions SET status = 'active', next_ship_date = ?, pause_reason = NULL WHERE id = ?"
  ).run(nextShipDate.toISOString(), id);

  const updated = db.prepare(`
    SELECT s.*, p.name as plan_name, p.price, p.snacks_count
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.id = ?
  `).get(id);

  res.json(updated);
});

router.post('/:id/change-plan', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { plan_id } = req.body;

  if (!plan_id) {
    res.status(400).json({ error: '请选择新方案' });
    return;
  }

  const subscription = db.prepare(
    'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id) as any;

  if (!subscription) {
    res.status(404).json({ error: '订阅不存在' });
    return;
  }

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(plan_id);
  if (!plan) {
    res.status(404).json({ error: '方案不存在' });
    return;
  }

  db.prepare('UPDATE subscriptions SET plan_id = ? WHERE id = ?').run(plan_id, id);

  const updated = db.prepare(`
    SELECT s.*, p.name as plan_name, p.price, p.snacks_count
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.id = ?
  `).get(id);

  res.json(updated);
});

router.get('/:id/history', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;

  const subscription = db.prepare(
    'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id);

  if (!subscription) {
    res.status(404).json({ error: '订阅不存在' });
    return;
  }

  const boxes = db.prepare(`
    SELECT b.*, 
           GROUP_CONCAT(s.name, ', ') as snacks_list
    FROM boxes b
    LEFT JOIN box_snacks bs ON b.id = bs.box_id
    LEFT JOIN snacks s ON bs.snack_id = s.id
    WHERE b.subscription_id = ?
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `).all(id);

  res.json(boxes);
});

export default router;
