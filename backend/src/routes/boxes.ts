import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/my-boxes', authMiddleware, (req: AuthRequest, res) => {
  const boxes = db.prepare(`
    SELECT b.*
    FROM boxes b
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user!.id) as any[];

  const result = boxes.map(box => {
    const snacks = db.prepare(`
      SELECT s.*, bs.quantity
      FROM box_snacks bs
      JOIN snacks s ON bs.snack_id = s.id
      WHERE bs.box_id = ?
    `).all(box.id);

    return { ...box, snacks };
  });

  res.json(result);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;

  const box = db.prepare(`
    SELECT b.*
    FROM boxes b
    WHERE b.id = ? AND b.user_id = ?
  `).get(id, req.user!.id) as any;

  if (!box) {
    res.status(404).json({ error: '盒子不存在' });
    return;
  }

  const snacks = db.prepare(`
    SELECT s.*, bs.quantity
    FROM box_snacks bs
    JOIN snacks s ON bs.snack_id = s.id
    WHERE bs.box_id = ?
  `).all(box.id);

  const ratings = db.prepare(`
    SELECT snack_id, rating, comment
    FROM ratings
    WHERE box_id = ? AND user_id = ?
  `).all(id, req.user!.id);

  const ratingsMap: Record<string, any> = {};
  ratings.forEach((r: any) => {
    ratingsMap[r.snack_id] = r;
  });

  const snacksWithRatings = snacks.map((s: any) => ({
    ...s,
    user_rating: ratingsMap[s.id] || null
  }));

  res.json({
    ...box,
    snacks: snacksWithRatings
  });
});

router.post('/:boxId/rate/:snackId', authMiddleware, (req: AuthRequest, res) => {
  const { boxId, snackId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: '评分必须在1-5之间' });
    return;
  }

  const box = db.prepare(
    'SELECT * FROM boxes WHERE id = ? AND user_id = ?'
  ).get(boxId, req.user!.id);

  if (!box) {
    res.status(404).json({ error: '盒子不存在' });
    return;
  }

  const boxSnack = db.prepare(
    'SELECT * FROM box_snacks WHERE box_id = ? AND snack_id = ?'
  ).get(boxId, snackId);

  if (!boxSnack) {
    res.status(404).json({ error: '该零食不在此盒子中' });
    return;
  }

  const existingRating = db.prepare(
    'SELECT id FROM ratings WHERE user_id = ? AND snack_id = ? AND box_id = ?'
  ).get(req.user!.id, snackId, boxId) as any;

  if (existingRating) {
    db.prepare(
      'UPDATE ratings SET rating = ?, comment = ? WHERE id = ?'
    ).run(rating, comment || '', existingRating.id);
  } else {
    const ratingId = uuidv4();
    db.prepare(
      'INSERT INTO ratings (id, user_id, snack_id, box_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(ratingId, req.user!.id, snackId, boxId, rating, comment || '');
  }

  const updatedRating = db.prepare(
    'SELECT * FROM ratings WHERE user_id = ? AND snack_id = ? AND box_id = ?'
  ).get(req.user!.id, snackId, boxId);

  res.json(updatedRating);
});

router.get('/:id/logistics', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;

  const box = db.prepare(
    'SELECT * FROM boxes WHERE id = ? AND user_id = ?'
  ).get(id, req.user!.id) as any;

  if (!box) {
    res.status(404).json({ error: '盒子不存在' });
    return;
  }

  const logisticsData = {
    status: box.status,
    tracking_number: box.tracking_number,
    logistics_company: box.logistics_company,
    shipped_at: box.shipped_at,
    delivered_at: box.delivered_at,
    timeline: generateLogisticsTimeline(box)
  };

  res.json(logisticsData);
});

function generateLogisticsTimeline(box: any) {
  const timeline = [
    { status: 'order_placed', time: box.created_at, description: '订单已创建' }
  ];

  if (box.status === 'shipped' || box.status === 'delivered') {
    timeline.push({
      status: 'shipped',
      time: box.shipped_at,
      description: `包裹已由${box.logistics_company}揽收，运单号：${box.tracking_number}`
    });

    if (box.status === 'delivered') {
      timeline.push({
        status: 'delivered',
        time: box.delivered_at,
        description: '包裹已签收'
      });
    } else {
      timeline.push({
        status: 'in_transit',
        time: new Date().toISOString(),
        description: '包裹运输中，预计2-3天送达'
      });
    }
  } else {
    timeline.push({
      status: 'preparing',
      time: new Date().toISOString(),
      description: '商品准备中，预计3个工作日内发货'
    });
  }

  return timeline;
}

export default router;
