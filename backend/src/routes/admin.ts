import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { generateSmartBox } from '../boxGenerator';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', (req: AuthRequest, res) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('user') as any).count;
  const totalSubscriptions = (db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get() as any).count;
  const totalSnacks = (db.prepare('SELECT COUNT(*) as count FROM snacks').get() as any).count;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'paid'").get() as any).total;

  const planStats = db.prepare(`
    SELECT p.id, p.name, p.price, 
           COUNT(s.id) as subscriber_count,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.amount), 0) as revenue
    FROM plans p
    LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
    LEFT JOIN orders o ON p.id = o.plan_id AND o.status = 'paid'
    GROUP BY p.id
    ORDER BY p.price ASC
  `).all();

  const monthlyRevenue = db.prepare(`
    SELECT 
      strftime('%Y-%m', paid_at) as month,
      COUNT(*) as order_count,
      SUM(amount) as revenue
    FROM orders
    WHERE status = 'paid' AND paid_at IS NOT NULL
    GROUP BY strftime('%Y-%m', paid_at)
    ORDER BY month DESC
    LIMIT 12
  `).all();

  res.json({
    total_users: totalUsers,
    total_subscriptions: totalSubscriptions,
    total_snacks: totalSnacks,
    total_revenue: totalRevenue,
    plan_stats: planStats,
    monthly_revenue: monthlyRevenue
  });
});

router.get('/snacks', (req: AuthRequest, res) => {
  const snacks = db.prepare('SELECT * FROM snacks ORDER BY created_at DESC').all();
  res.json(snacks);
});

router.post('/snacks', (req: AuthRequest, res) => {
  const { name, description, image, category, taste_sweet, taste_salty, taste_spicy, contains_nuts, price, stock } = req.body;

  if (!name || !category) {
    res.status(400).json({ error: '名称和分类必填' });
    return;
  }

  const id = uuidv4();

  db.prepare(`
    INSERT INTO snacks (id, name, description, image, category, taste_sweet, taste_salty, taste_spicy, contains_nuts, price, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name,
    description || '',
    image || '',
    category,
    taste_sweet || 0,
    taste_salty || 0,
    taste_spicy || 0,
    contains_nuts || 0,
    price || 0,
    stock || 100
  );

  const snack = db.prepare('SELECT * FROM snacks WHERE id = ?').get(id);
  res.status(201).json(snack);
});

router.put('/snacks/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, description, image, category, taste_sweet, taste_salty, taste_spicy, contains_nuts, price, stock } = req.body;

  const existing = db.prepare('SELECT id FROM snacks WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: '零食不存在' });
    return;
  }

  db.prepare(`
    UPDATE snacks 
    SET name = ?, description = ?, image = ?, category = ?, 
        taste_sweet = ?, taste_salty = ?, taste_spicy = ?, 
        contains_nuts = ?, price = ?, stock = ?
    WHERE id = ?
  `).run(
    name, description || '', image || '', category,
    taste_sweet || 0, taste_salty || 0, taste_spicy || 0,
    contains_nuts || 0, price || 0, stock || 100, id
  );

  const snack = db.prepare('SELECT * FROM snacks WHERE id = ?').get(id);
  res.json(snack);
});

router.delete('/snacks/:id', (req: AuthRequest, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM snacks WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: '零食不存在' });
    return;
  }

  db.prepare('DELETE FROM box_snacks WHERE snack_id = ?').run(id);
  db.prepare('DELETE FROM ratings WHERE snack_id = ?').run(id);
  db.prepare('DELETE FROM snacks WHERE id = ?').run(id);

  res.json({ success: true });
});

router.get('/plans', (req: AuthRequest, res) => {
  const plans = db.prepare('SELECT * FROM plans ORDER BY price ASC').all();
  res.json(plans);
});

router.post('/plans', (req: AuthRequest, res) => {
  const { name, description, price, snacks_count, billing_cycle, popular } = req.body;

  if (!name || !price || !snacks_count) {
    res.status(400).json({ error: '请填写完整的方案信息' });
    return;
  }

  const id = uuidv4();

  db.prepare(`
    INSERT INTO plans (id, name, description, price, snacks_count, billing_cycle, popular)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description || '', price, snacks_count, billing_cycle || 'monthly', popular ? 1 : 0);

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
  res.status(201).json(plan);
});

router.put('/plans/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, description, price, snacks_count, billing_cycle, popular } = req.body;

  const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: '方案不存在' });
    return;
  }

  db.prepare(`
    UPDATE plans 
    SET name = ?, description = ?, price = ?, snacks_count = ?, billing_cycle = ?, popular = ?
    WHERE id = ?
  `).run(name, description || '', price, snacks_count, billing_cycle || 'monthly', popular ? 1 : 0, id);

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
  res.json(plan);
});

router.delete('/plans/:id', (req: AuthRequest, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: '方案不存在' });
    return;
  }

  const activeSubs = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ? AND status = ?').get(id, 'active') as any;
  if (activeSubs.count > 0) {
    res.status(400).json({ error: '有活跃订阅的方案不能删除' });
    return;
  }

  db.prepare('DELETE FROM orders WHERE plan_id = ?').run(id);
  db.prepare('DELETE FROM subscriptions WHERE plan_id = ?').run(id);
  db.prepare('DELETE FROM plans WHERE id = ?').run(id);

  res.json({ success: true });
});

router.get('/subscriptions', (req: AuthRequest, res) => {
  const { status } = req.query;
  
  let query = `
    SELECT s.*, u.name as user_name, u.email as user_email, p.name as plan_name
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    JOIN plans p ON s.plan_id = p.id
  `;
  
  const params: any[] = [];
  if (status) {
    query += ' WHERE s.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY s.created_at DESC';
  
  const subscriptions = db.prepare(query).all(...params);
  res.json(subscriptions);
});

router.get('/boxes', (req: AuthRequest, res) => {
  const { status } = req.query;
  
  let query = `
    SELECT b.*, u.name as user_name, p.name as plan_name
    FROM boxes b
    JOIN users u ON b.user_id = u.id
    JOIN subscriptions s ON b.subscription_id = s.id
    JOIN plans p ON s.plan_id = p.id
  `;
  
  const params: any[] = [];
  if (status) {
    query += ' WHERE b.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY b.created_at DESC';
  
  const boxes = db.prepare(query).all(...params);
  res.json(boxes);
});

router.post('/boxes/:id/ship', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { tracking_number, logistics_company } = req.body;

  const box = db.prepare('SELECT * FROM boxes WHERE id = ?').get(id) as any;
  if (!box) {
    res.status(404).json({ error: '盒子不存在' });
    return;
  }

  if (box.status === 'shipped' || box.status === 'delivered') {
    res.status(400).json({ error: '盒子已发货' });
    return;
  }

  const shippedAt = new Date().toISOString();

  db.prepare(`
    UPDATE boxes 
    SET status = 'shipped', shipped_at = ?, tracking_number = ?, logistics_company = ?
    WHERE id = ?
  `).run(shippedAt, tracking_number || '', logistics_company || '顺丰速运', id);

  const subscription = db.prepare(
    "SELECT * FROM subscriptions WHERE id = ? AND status = 'active'"
  ).get(box.subscription_id) as any;

  if (subscription) {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(subscription.plan_id) as any;

    const nextMonthBoxExists = db.prepare(`
      SELECT id FROM boxes 
      WHERE subscription_id = ? AND status = 'pending'
      AND id != ?
      LIMIT 1
    `).get(box.subscription_id, id);

    if (!nextMonthBoxExists) {
      generateSmartBox(subscription.id, box.user_id, plan.snacks_count);
    }

    const nextShipDate = new Date();
    nextShipDate.setMonth(nextShipDate.getMonth() + 1);
    nextShipDate.setDate(5);
    db.prepare(
      'UPDATE subscriptions SET next_ship_date = ? WHERE id = ?'
    ).run(nextShipDate.toISOString(), subscription.id);
  }

  const updated = db.prepare('SELECT * FROM boxes WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/boxes/:id/deliver', (req: AuthRequest, res) => {
  const { id } = req.params;

  const box = db.prepare('SELECT * FROM boxes WHERE id = ?').get(id) as any;
  if (!box) {
    res.status(404).json({ error: '盒子不存在' });
    return;
  }

  if (box.status !== 'shipped') {
    res.status(400).json({ error: '只有已发货的盒子才能标记为已送达' });
    return;
  }

  const deliveredAt = new Date().toISOString();

  db.prepare(`
    UPDATE boxes SET status = 'delivered', delivered_at = ? WHERE id = ?
  `).run(deliveredAt, id);

  const updated = db.prepare('SELECT * FROM boxes WHERE id = ?').get(id);
  res.json(updated);
});

export default router;
