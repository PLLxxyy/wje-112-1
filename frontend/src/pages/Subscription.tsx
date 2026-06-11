import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  next_ship_date: string;
  plan_name: string;
  price: number;
  snacks_count: number;
}

interface Box {
  id: string;
  month: string;
  year: number;
  status: string;
  snacks_list: string;
  shipped_at: string;
  delivered_at: string;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  snacks_count: number;
}

export default function Subscription() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [history, setHistory] = useState<Box[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsRes, plansRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/plans'),
      ]);
      
      setSubscriptions(subsRes.data);
      setPlans(plansRes.data);

      if (subsRes.data.length > 0) {
        const subId = subsRes.data[0].id;
        const historyRes = await api.get(`/subscriptions/${subId}/history`);
        setHistory(historyRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (subId: string) => {
    if (!confirm('确定要暂停订阅吗？')) return;
    
    setActionLoading(subId);
    try {
      await api.post(`/subscriptions/${subId}/pause`, { reason: '用户主动暂停' });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (subId: string) => {
    setActionLoading(subId);
    try {
      await api.post(`/subscriptions/${subId}/resume`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (subId: string, planId: string) => {
    setActionLoading(subId);
    try {
      await api.post(`/subscriptions/${subId}/change-plan`, { plan_id: planId });
      setShowChangePlan(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(null);
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

  const getBoxStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '准备中', color: 'bg-gray-100 text-gray-700' },
      shipped: { text: '运输中', color: 'bg-blue-100 text-blue-700' },
      delivered: { text: '已签收', color: 'bg-green-100 text-green-700' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
  };

  const activeSub = subscriptions.find(s => s.status === 'active') || subscriptions[0];

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">📦</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">还没有订阅</h2>
        <p className="text-gray-500 mb-8">选择一个方案，开启你的零食之旅</p>
        <Link
          to="/plans"
          className="bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors inline-block"
        >
          查看订阅方案
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">我的订阅</h1>

      {activeSub && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{activeSub.plan_name}</h2>
              <p className="text-gray-500 mt-1">每月 {activeSub.snacks_count} 款精选零食</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusText(activeSub.status).color}`}>
              {getStatusText(activeSub.status).text}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">月费</p>
              <p className="text-xl font-bold text-gray-900">¥{activeSub.price}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">开始日期</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(activeSub.start_date).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">下次发货</p>
              <p className="text-lg font-semibold text-gray-900">
                {activeSub.next_ship_date 
                  ? new Date(activeSub.next_ship_date).toLocaleDateString('zh-CN')
                  : '待定'}
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            {activeSub.status === 'active' ? (
              <>
                <button
                  onClick={() => setShowChangePlan(true)}
                  disabled={actionLoading === activeSub.id}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  更换方案
                </button>
                <button
                  onClick={() => handlePause(activeSub.id)}
                  disabled={actionLoading === activeSub.id}
                  className="flex-1 bg-yellow-100 text-yellow-700 py-3 rounded-lg font-semibold hover:bg-yellow-200 transition-colors"
                >
                  {actionLoading === activeSub.id ? '处理中...' : '暂停订阅'}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleResume(activeSub.id)}
                disabled={actionLoading === activeSub.id}
                className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                {actionLoading === activeSub.id ? '处理中...' : '续订'}
              </button>
            )}
          </div>
        </div>
      )}

      {showChangePlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">选择新方案</h3>
            <div className="space-y-3 mb-6">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleChangePlan(activeSub!.id, plan.id)}
                  disabled={plan.id === activeSub?.plan_id}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    plan.id === activeSub?.plan_id
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{plan.name}</span>
                    <span className="text-primary-600 font-bold">¥{plan.price}/月</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{plan.snacks_count} 款零食/月</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowChangePlan(false)}
              className="w-full py-2 text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">历史收货记录</h3>
        
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无历史记录</p>
        ) : (
          <div className="space-y-4">
            {history.map((box) => (
              <Link
                key={box.id}
                to={`/boxes/${box.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                    📦
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {box.year}年 {box.month}
                    </h4>
                    <p className="text-sm text-gray-500">{box.snacks_list || '多款精选零食'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBoxStatusText(box.status).color}`}>
                    {getBoxStatusText(box.status).text}
                  </span>
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
