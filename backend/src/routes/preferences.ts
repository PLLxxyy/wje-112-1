import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { taste_sweet, taste_salty, taste_spicy, nut_allergy } = req.body;

  if (
    taste_sweet === undefined ||
    taste_salty === undefined ||
    taste_spicy === undefined ||
    nut_allergy === undefined
  ) {
    res.status(400).json({ error: '请填写完整的口味偏好' });
    return;
  }

  db.prepare(
    `UPDATE users 
     SET taste_sweet = ?, taste_salty = ?, taste_spicy = ?, nut_allergy = ?, preferences_set = 1
     WHERE id = ?`
  ).run(taste_sweet, taste_salty, taste_spicy, nut_allergy, req.user!.id);

  const user = db.prepare(
    'SELECT id, taste_sweet, taste_salty, taste_spicy, nut_allergy, preferences_set FROM users WHERE id = ?'
  ).get(req.user!.id);

  res.json(user);
});

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare(
    'SELECT taste_sweet, taste_salty, taste_spicy, nut_allergy, preferences_set FROM users WHERE id = ?'
  ).get(req.user!.id);

  res.json(user);
});

router.get('/recommendations', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare(
    'SELECT taste_sweet, taste_salty, taste_spicy, nut_allergy, preferences_set FROM users WHERE id = ?'
  ).get(req.user!.id) as any;

  if (!user?.preferences_set) {
    res.status(400).json({ error: '请先完成口味偏好问卷' });
    return;
  }

  const plans = db.prepare('SELECT * FROM plans ORDER BY price ASC').all() as any[];

  const recommendedPlans = plans.map(plan => {
    let score = 50;

    if (plan.snacks_count >= 8) score += 20;
    if (plan.snacks_count >= 12) score += 10;
    if (plan.popular) score += 15;

    return {
      ...plan,
      match_score: Math.min(score, 99)
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const userRatings = db.prepare(`
    SELECT snack_id, rating FROM ratings WHERE user_id = ?
  `).all(req.user!.id) as any[];

  const snackPreferenceBoost: Record<string, number> = {};
  userRatings.forEach(r => {
    snackPreferenceBoost[r.snack_id] = (r.rating - 3) * 10;
  });

  let eligibleSnacks = db.prepare(`
    SELECT * FROM snacks 
    WHERE 1=1
    ${user.nut_allergy ? 'AND contains_nuts = 0' : ''}
  `).all() as any[];

  const scoredSnacks = eligibleSnacks.map(snack => {
    let score = 50;

    const sweetDiff = Math.abs(snack.taste_sweet - user.taste_sweet);
    const saltyDiff = Math.abs(snack.taste_salty - user.taste_salty);
    const spicyDiff = Math.abs(snack.taste_spicy - user.taste_spicy);

    score -= (sweetDiff + saltyDiff + spicyDiff) * 5;

    if (snackPreferenceBoost[snack.id]) {
      score += snackPreferenceBoost[snack.id];
    }

    return {
      ...snack,
      match_score: Math.max(0, Math.min(100, Math.round(score)))
    };
  }).sort((a, b) => b.match_score - a.match_score);

  res.json({
    plans: recommendedPlans,
    snacks: scoredSnacks.slice(0, 10),
    user_preferences: {
      taste_sweet: user.taste_sweet,
      taste_salty: user.taste_salty,
      taste_spicy: user.taste_spicy,
      nut_allergy: user.nut_allergy
    }
  });
});

export default router;
