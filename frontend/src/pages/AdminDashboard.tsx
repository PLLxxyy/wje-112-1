import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Stats {
  total_users: number;
  total_subscriptions: number;
  total_snacks: number;
  total_revenue: number;
  plan_stats: any[];
  monthly_revenue: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">商家后台</h1>
        <div className="flex space-x-3">
          <Link to="/admin/snacks" className="bg-white px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 border">
            零食管理
          </Link>
          <Link to="/admin/plans" className="bg-white px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 border">
            方案管理
          </Link>
          <Link to="/admin/subscriptions" className="bg-white px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 border">
            订阅管理
          </Link>
          <Link to="/admin/boxes" className="bg-white px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 border">
            盒子管理
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500 text-sm mb-2">总用户数</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.total_users || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500 text-sm mb-2">活跃订阅</p>
          <p className="text-3xl font-bold text-green-600">{stats?.total_subscriptions || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500 text-sm mb-2">零食SKU</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.total_snacks || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500 text-sm mb-2">总收入</p>
          <p className="text-3xl font-bold text-primary-600">¥{stats?.total_revenue?.toFixed(2) || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">各方案销售数据</h3>
          <div className="space-y-4">
            {stats?.plan_stats?.map((plan: any) => (
              <div key={plan.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <p className="text-sm text-gray-500">
                    {plan.subscriber_count} 人订阅 · {plan.order_count} 单
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">¥{plan.revenue?.toFixed(2) || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">月度收入趋势</h3>
          <div className="space-y-3">
            {stats?.monthly_revenue?.map((item: any) => (
              <div key={item.month} className="flex items-center">
                <span className="text-sm text-gray-500 w-20">{item.month}</span>
                <div className="flex-1 mx-3 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-primary-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(5, (item.revenue / (stats?.total_revenue || 1)) * 100 * 3)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-24 text-right">
                  ¥{item.revenue?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
