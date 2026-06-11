import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  snacks_count: number;
  billing_cycle: string;
  popular: number;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    snacks_count: 6,
    billing_cycle: 'monthly',
    popular: 0,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get('/admin/plans');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, formData);
      } else {
        await api.post('/admin/plans', formData);
      }
      setShowModal(false);
      setEditingPlan(null);
      loadPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || '保存失败');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      snacks_count: plan.snacks_count,
      billing_cycle: plan.billing_cycle,
      popular: plan.popular,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个方案吗？')) return;
    
    try {
      await api.delete(`/admin/plans/${id}`);
      loadPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const openAddModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      snacks_count: 6,
      billing_cycle: 'monthly',
      popular: 0,
    });
    setShowModal(true);
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
          <h1 className="text-3xl font-bold text-gray-900">方案管理</h1>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
        >
          + 添加方案
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                {plan.popular ? (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                    热门
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-bold text-primary-600">¥{plan.price}</p>
            </div>
            <p className="text-gray-500 text-sm mb-4 h-10">{plan.description}</p>
            <p className="text-gray-600 mb-6">
              每月 <span className="font-semibold">{plan.snacks_count}</span> 款零食
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex-1 py-2 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingPlan ? '编辑方案' : '添加方案'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">方案名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">零食数量</label>
                  <input
                    type="number"
                    value={formData.snacks_count}
                    onChange={(e) => setFormData({ ...formData, snacks_count: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="popular"
                  checked={formData.popular === 1}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="popular" className="text-sm text-gray-700">
                  设为热门推荐
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
