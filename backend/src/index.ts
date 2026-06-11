import express from 'express';
import cors from 'cors';
import { initDatabase } from './schema';
import authRoutes from './routes/auth';
import preferencesRoutes from './routes/preferences';
import subscriptionsRoutes from './routes/subscriptions';
import ordersRoutes from './routes/orders';
import boxesRoutes from './routes/boxes';
import snacksRoutes from './routes/snacks';
import plansRoutes from './routes/plans';
import adminRoutes from './routes/admin';

initDatabase();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/boxes', boxesRoutes);
app.use('/api/snacks', snacksRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Snack Box API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
