import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  snacks_count: number;
  popular: number;
  match_score?: number;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const [plansRes, recRes] = await Promise.all([
        api.get('/plans'),
        user ? api.get('/preferences/recommendations').catch(() => null) : Promise.resolve(null),
      ]);
      
      setPlans(plansRes.data);
      
      if (recRes?.data) {
        setRecommendations(recRes.data);
        const planMap: Record<string, number> = {};
        recRes.data.plans.forEach((p: any) => {
          planMap[p.id] = p.match_score;
        });
        setPlans(
          plansRes.data.map((p: Plan) => ({
            ...p,
            match_score: planMap[p.id],
          })).sort((a: Plan, b: Plan) => (b.match_score || 0) - (a.match_score || 0))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setOrderLoading(true);
    try {
      const res = await api.post('/orders', { plan_id: planId });
      setSelectedPlan(res.data.id);
      
      const payRes = await api.post(`/orders/${res.data.id}/pay`);
      if (payRes.data.success) {
        navigate('/subscription');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '下单失败，请重试');
    } finally {
      setOrderLoading(false);
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
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">选择你的订阅方案</h1>
        <p className="text-xl text-gray-600">
          {recommendations ? '根据你的口味偏好，为你推荐以下方案' : '每月新鲜搭配，惊喜不断'}
        </p>
        {!user && (
          <p className="mt-4 text-gray-500">
            <Link to="/register" className="text-primary-600 hover:text-primary-700">
              注册并填写口味偏好
            </Link>
            ，获取专属推荐
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-lg p-8 transition-all hover:shadow-xl ${
              plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                最受欢迎
              </div>
            )}
            {plan.match_score && (
              <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                匹配度 {plan.match_score}%
              </div>
            )}

            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <p className="text-gray-500 mb-6 h-12">{plan.description}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">¥{plan.price}</span>
              <span className="text-gray-500 ml-2">/月</span>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-600">
                <span className="mr-2">🍬</span>
                <span>每月 {plan.snacks_count} 款精选零食</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-2">🚚</span>
                <span>全国包邮</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-2">✨</span>
                <span>每月不重样</span>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={orderLoading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.popular
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {orderLoading && selectedPlan === plan.id ? '处理中...' : '立即订阅'}
            </button>
          </div>
        ))}
      </div>

      {recommendations?.snacks?.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            根据你的口味推荐的零食
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {recommendations.snacks.slice(0, 5).map((snack: any) => (
              <div key={snack.id} className="bg-white rounded-lg shadow p-4 text-center">
                <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
                  🍪
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{snack.name}</h4>
                <div className="text-xs text-green-600 font-semibold">
                  匹配度 {snack.match_score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
