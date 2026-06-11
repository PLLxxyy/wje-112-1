import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    res.status(400).json({ error: '该邮箱已被注册' });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();

  db.prepare(
    'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, email, hashedPassword, name, 'user');

  const token = generateToken(id, email, 'user');

  res.status(201).json({
    token,
    user: { id, email, name, role: 'user', preferences_set: 0 }
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: '请输入邮箱和密码' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  const token = generateToken(user.id, user.email, user.role);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferences_set: user.preferences_set
    }
  });
});

router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare(
    'SELECT id, email, name, role, taste_sweet, taste_salty, taste_spicy, nut_allergy, preferences_set, created_at FROM users WHERE id = ?'
  ).get(req.user!.id) as any;

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json(user);
});

router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  const { name } = req.body;
  
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name || req.user!.email.split('@')[0], req.user!.id);
  
  const user = db.prepare(
    'SELECT id, email, name, role, taste_sweet, taste_salty, taste_spicy, nut_allergy, preferences_set, created_at FROM users WHERE id = ?'
  ).get(req.user!.id);

  res.json(user);
});

export default router;
