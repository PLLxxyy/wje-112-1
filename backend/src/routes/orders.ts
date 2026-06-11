import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name as plan_name, p.snacks_count
    FROM orders o
    JOIN plans p ON o.plan_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user!.id);

  res.json(orders);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { plan_id, payment_method = 'alipay' } = req.body;

  if (!plan_id) {
    res.status(400).json({ error: '请选择订阅方案' });
    return;
  }

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(plan_id) as any;
  if (!plan) {
    res.status(404).json({ error: '方案不存在' });
    return;
  }

  const orderId = uuidv4();

  db.prepare(`
    INSERT INTO orders (id, user_id, plan_id, amount, status, payment_method)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(orderId, req.user!.id, plan_id, plan.price, payment_method);

  res.status(201).json({
    id: orderId,
    amount: plan.price,
    status: 'pending',
    payment_method,
    plan_name: plan.name
  });
});

router.post('/:id/pay', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;

  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id) as any;

  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  if (order.status === 'paid') {
    res.status(400).json({ error: '订单已支付' });
    return;
  }

  const paidAt = new Date().toISOString();
  
  db.prepare(
    "UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?"
  ).run(paidAt, id);

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(order.plan_id) as any;
  
  const activeSub = db.prepare(
    "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'"
  ).get(req.user!.id) as any;

  let subscriptionId: string;

  if (activeSub) {
    subscriptionId = activeSub.id;
    db.prepare('UPDATE subscriptions SET plan_id = ? WHERE id = ?').run(order.plan_id, activeSub.id);
  } else {
    subscriptionId = uuidv4();
    const nextShipDate = new Date();
    nextShipDate.setMonth(nextShipDate.getMonth() + 1);
    nextShipDate.setDate(5);

    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan_id, status, start_date, next_ship_date)
      VALUES (?, ?, ?, 'active', ?, ?)
    `).run(
      subscriptionId,
      req.user!.id,
      order.plan_id,
      new Date().toISOString(),
      nextShipDate.toISOString()
    );
  }

  db.prepare(
    'UPDATE orders SET subscription_id = ? WHERE id = ?'
  ).run(subscriptionId, id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  generateFirstBox(subscriptionId, req.user!.id, plan.snacks_count, user);

  res.json({
    success: true,
    order_id: id,
    subscription_id: subscriptionId,
    status: 'paid'
  });
});

function generateFirstBox(subscriptionId: string, userId: string, snacksCount: number, user: any) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const boxId = uuidv4();
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  db.prepare(`
    INSERT INTO boxes (id, subscription_id, user_id, month, year, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(
    boxId,
    subscriptionId,
    userId,
    months[nextMonth.getMonth()],
    nextMonth.getFullYear()
  );

  let snacks = db.prepare(`
    SELECT * FROM snacks 
    WHERE 1=1
    ${user?.nut_allergy ? 'AND contains_nuts = 0' : ''}
    ORDER BY RANDOM()
    LIMIT ?
  `).all(snacksCount) as any[];

  if (snacks.length < snacksCount) {
    snacks = db.prepare('SELECT * FROM snacks ORDER BY RANDOM() LIMIT ?').all(snacksCount) as any[];
  }

  const insertBoxSnack = db.prepare(
    'INSERT INTO box_snacks (id, box_id, snack_id, quantity) VALUES (?, ?, ?, 1)'
  );

  snacks.forEach(snack => {
    insertBoxSnack.run(uuidv4(), boxId, snack.id);
  });

  return boxId;
}

export default router;
