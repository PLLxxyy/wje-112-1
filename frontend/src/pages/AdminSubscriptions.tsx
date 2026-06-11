import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Subscription {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_id: string;
  plan_name: string;
  status: string;
  start_date: string;
  next_ship_date: string;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter]);

  const loadSubscriptions = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/admin/subscriptions' 
        : `/admin/subscriptions?status=${statusFilter}`;
      const res = await api.get(url);
      setSubscriptions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      active: { text: '订阅中', color: 'bg-green-100 text-green-700' },
      paused: { text: '已暂停', color: 'bg-yellow-100 text-yellow-700' },
      cancelled: { text: '已取消', color: 'bg-red-100 text-red-700' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
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
        <div>
          <Link to="/admin" className="text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← 返回控制台
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">订阅管理</h1>
        </div>
        <div className="flex space-x-2">
          {['all', 'active', 'paused', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border'
              }`}
            >
              {status === 'all' ? '全部' : getStatusText(status).text}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">用户</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">方案</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">状态</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">开始时间</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">下次发货</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{sub.user_name}</p>
                  <p className="text-sm text-gray-500">{sub.user_email}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">{sub.plan_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusText(sub.status).color}`}>
                    {getStatusText(sub.status).text}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(sub.start_date).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {sub.next_ship_date ? new Date(sub.next_ship_date).toLocaleDateString('zh-CN') : '待定'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {subscriptions.length === 0 && (
          <p className="text-center text-gray-500 py-12">暂无订阅数据</p>
        )}
      </div>
    </div>
  );
}
