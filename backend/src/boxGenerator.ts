import { v4 as uuidv4 } from 'uuid';
import db from './db';

interface UserPreference {
  taste_sweet: number;
  taste_salty: number;
  taste_spicy: number;
  nut_allergy: number;
}

interface SnackRow {
  id: string;
  name: string;
  taste_sweet: number;
  taste_salty: number;
  taste_spicy: number;
  contains_nuts: number;
  [key: string]: any;
}

interface ScoredSnack extends SnackRow {
  _score: number;
}

interface RatingRow {
  snack_id: string;
  rating: number;
}

export function generateSmartBox(
  subscriptionId: string,
  userId: string,
  snacksCount: number
): string {
  const user = db.prepare(
    'SELECT taste_sweet, taste_salty, taste_spicy, nut_allergy FROM users WHERE id = ?'
  ).get(userId) as UserPreference | undefined;

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const boxId = uuidv4();
  const months = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

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

  const snacks = selectSnacksForUser(userId, snacksCount, user);

  const insertBoxSnack = db.prepare(
    'INSERT INTO box_snacks (id, box_id, snack_id, quantity) VALUES (?, ?, ?, 1)'
  );

  snacks.forEach(snack => {
    insertBoxSnack.run(uuidv4(), boxId, snack.id);
  });

  return boxId;
}

function selectSnacksForUser(
  userId: string,
  count: number,
  user: UserPreference | undefined
): SnackRow[] {
  const userRatings = db.prepare(`
    SELECT snack_id, rating FROM ratings WHERE user_id = ?
  `).all(userId) as RatingRow[];

  const ratingMap: Record<string, number> = {};
  userRatings.forEach(r => {
    ratingMap[r.snack_id] = r.rating;
  });

  const previousBoxSnackIds = db.prepare(`
    SELECT bs.snack_id
    FROM box_snacks bs
    JOIN boxes b ON bs.box_id = b.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
    LIMIT ?
  `).all(userId, count * 2) as { snack_id: string }[];
  const previousSet = new Set(previousBoxSnackIds.map(s => s.snack_id));

  let allSnacks = db.prepare('SELECT * FROM snacks').all() as SnackRow[];

  if (user?.nut_allergy) {
    allSnacks = allSnacks.filter(s => !s.contains_nuts);
  }

  const scored: ScoredSnack[] = allSnacks.map(snack => {
    let score = 0;

    if (user) {
      const sweetDiff = Math.abs(snack.taste_sweet - user.taste_sweet);
      const saltyDiff = Math.abs(snack.taste_salty - user.taste_salty);
      const spicyDiff = Math.abs(snack.taste_spicy - user.taste_spicy);
      score += 30 - (sweetDiff + saltyDiff + spicyDiff) * 5;
    } else {
      score += 15;
    }

    if (ratingMap[snack.id] !== undefined) {
      const r = ratingMap[snack.id];
      if (r >= 4) {
        score += 25;
      } else if (r === 3) {
        score += 5;
      } else if (r === 2) {
        score -= 15;
      } else {
        score -= 30;
      }
    }

    if (previousSet.has(snack.id)) {
      score -= 10;
    }

    const noise = Math.random() * 15;
    score += noise;

    return { ...snack, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  let selected: SnackRow[] = scored.slice(0, count);

  if (selected.length < count) {
    const selectedIds = new Set(selected.map(s => s.id));
    const remaining = allSnacks.filter(s => !selectedIds.has(s.id));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    selected = [...selected, ...shuffled.slice(0, count - selected.length)];
  }

  return selected;
}
