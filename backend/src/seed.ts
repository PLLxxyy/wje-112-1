import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from './db';
import { initDatabase } from './schema';

initDatabase();

const adminId = 'admin-001';
const adminEmail = 'admin@snackbox.com';
const adminPassword = bcrypt.hashSync('admin123', 10);

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  db.prepare(
    'INSERT INTO users (id, email, password, name, role, preferences_set) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(adminId, adminEmail, adminPassword, '管理员', 'admin');
  console.log('管理员账号已创建: admin@snackbox.com / admin123');
}

const plans = [
  { id: 'plan-basic', name: '尝鲜盒', description: '每月6款精选零食，适合想尝试的新朋友', price: 69, snacks_count: 6, popular: 0 },
  { id: 'plan-standard', name: '经典盒', description: '每月10款人气零食，性价比之选', price: 99, snacks_count: 10, popular: 1 },
  { id: 'plan-premium', name: '尊享盒', description: '每月15款豪华零食，资深吃货必备', price: 159, snacks_count: 15, popular: 0 },
];

plans.forEach(plan => {
  const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(plan.id);
  if (!existing) {
    db.prepare(
      'INSERT INTO plans (id, name, description, price, snacks_count, popular) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(plan.id, plan.name, plan.description, plan.price, plan.snacks_count, plan.popular);
    console.log(`方案已创建: ${plan.name}`);
  }
});

const snacks = [
  { name: '北海道白色恋人巧克力饼干', description: '日本进口，白巧克力夹心饼干', category: '甜点', taste_sweet: 5, taste_salty: 1, taste_spicy: 0, contains_nuts: 0, price: 35, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' },
  { name: '三只松鼠麻辣牛肉干', description: '四川风味，麻辣鲜香', category: '肉干', taste_sweet: 1, taste_salty: 4, taste_spicy: 5, contains_nuts: 0, price: 28, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
  { name: '良品铺子每日坚果', description: '混合坚果，健康营养', category: '坚果', taste_sweet: 2, taste_salty: 3, taste_spicy: 0, contains_nuts: 1, price: 32, image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400' },
  { name: '卫龙辣条大面筋', description: '经典怀旧零食，麻辣爽口', category: '辣条', taste_sweet: 2, taste_salty: 3, taste_spicy: 4, contains_nuts: 0, price: 8, image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400' },
  { name: '百草味芒果干', description: '东南亚进口芒果，酸甜可口', category: '果干', taste_sweet: 4, taste_salty: 1, taste_spicy: 0, contains_nuts: 0, price: 18, image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400' },
  { name: '乐事原味薯片', description: '经典原味，香脆可口', category: '膨化', taste_sweet: 1, taste_salty: 4, taste_spicy: 0, contains_nuts: 0, price: 12, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400' },
  { name: '奥利奥夹心饼干', description: '巧克力味夹心，经典美味', category: '饼干', taste_sweet: 5, taste_salty: 1, taste_spicy: 0, contains_nuts: 0, price: 15, image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400' },
  { name: '周黑鸭卤鸭脖', description: '武汉特产，麻辣鲜香', category: '卤味', taste_sweet: 2, taste_salty: 3, taste_spicy: 4, contains_nuts: 0, price: 25, image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400' },
  { name: '好丽友派巧克力味', description: '巧克力涂层蛋糕，软糯香甜', category: '蛋糕', taste_sweet: 5, taste_salty: 1, taste_spicy: 0, contains_nuts: 0, price: 20, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
  { name: '良品铺子碧根果', description: '美国山核桃，香脆可口', category: '坚果', taste_sweet: 3, taste_salty: 3, taste_spicy: 0, contains_nuts: 1, price: 38, image: 'https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?w=400' },
  { name: '旺旺仙贝', description: '米果饼干，咸香酥脆', category: '膨化', taste_sweet: 2, taste_salty: 4, taste_spicy: 0, contains_nuts: 0, price: 10, image: 'https://images.unsplash.com/photo-1585109597323-e8c9b379e728?w=400' },
  { name: '德芙丝滑牛奶巧克力', description: '丝滑口感，牛奶香浓', category: '巧克力', taste_sweet: 5, taste_salty: 1, taste_spicy: 0, contains_nuts: 0, price: 22, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400' },
  { name: '劲仔小鱼干', description: '湖南特产，香辣小鱼', category: '海鲜', taste_sweet: 1, taste_salty: 4, taste_spicy: 5, contains_nuts: 0, price: 16, image: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400' },
  { name: '来伊份话梅', description: '酸甜话梅，开胃解腻', category: '蜜饯', taste_sweet: 3, taste_salty: 2, taste_spicy: 0, contains_nuts: 0, price: 14, image: 'https://images.unsplash.com/photo-1575224038131-8c5e2f6d6e66?w=400' },
  { name: '盼盼法式小面包', description: '软式面包，奶香浓郁', category: '面包', taste_sweet: 3, taste_salty: 2, taste_spicy: 0, contains_nuts: 0, price: 12, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { name: '蜀道香麻辣花生', description: '四川麻辣花生，下酒零食', category: '坚果', taste_sweet: 1, taste_salty: 3, taste_spicy: 4, contains_nuts: 1, price: 12, image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400' },
  { name: '徐福记沙琪玛', description: '松软沙琪玛，蛋香浓郁', category: '糕点', taste_sweet: 4, taste_salty: 2, taste_spicy: 0, contains_nuts: 0, price: 18, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
  { name: '无穷盐焗鸡蛋', description: '广东盐焗风味，蛋白Q弹', category: '卤蛋', taste_sweet: 1, taste_salty: 4, taste_spicy: 0, contains_nuts: 0, price: 6, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400' },
];

let snackCount = 0;
snacks.forEach(snack => {
  const existing = db.prepare('SELECT id FROM snacks WHERE name = ?').get(snack.name);
  if (!existing) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO snacks (id, name, description, image, category, taste_sweet, taste_salty, taste_spicy, contains_nuts, price, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100)
    `).run(id, snack.name, snack.description, snack.image, snack.category, snack.taste_sweet, snack.taste_salty, snack.taste_spicy, snack.contains_nuts, snack.price);
    snackCount++;
  }
});

console.log(`已创建 ${snackCount} 款零食`);
console.log('种子数据初始化完成！');
