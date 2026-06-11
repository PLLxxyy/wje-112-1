import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Snack {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  taste_sweet: number;
  taste_salty: number;
  taste_spicy: number;
  contains_nuts: number;
}

export default function AdminSnacks() {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    category: '',
    price: 0,
    stock: 100,
    taste_sweet: 3,
    taste_salty: 3,
    taste_spicy: 2,
    contains_nuts: 0,
  });

  useEffect(() => {
    loadSnacks();
  }, []);

  const loadSnacks = async () => {
    try {
      const res = await api.get('/admin/snacks');
      setSnacks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSnack) {
        await api.put(`/admin/snacks/${editingSnack.id}`, formData);
      } else {
        await api.post('/admin/snacks', formData);
      }
      setShowModal(false);
      setEditingSnack(null);
      loadSnacks();
    } catch (err: any) {
      alert(err.response?.data?.error || '保存失败');
    }
  };

  const handleEdit = (snack: Snack) => {
    setEditingSnack(snack);
    setFormData({
      name: snack.name,
      description: snack.description,
      image: '',
      category: snack.category,
      price: snack.price,
      stock: snack.stock,
      taste_sweet: snack.taste_sweet,
      taste_salty: snack.taste_salty,
      taste_spicy: snack.taste_spicy,
      contains_nuts: snack.contains_nuts,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这款零食吗？')) return;
    
    try {
      await api.delete(`/admin/snacks/${id}`);
      loadSnacks();
    } catch (err: any) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const openAddModal = () => {
    setEditingSnack(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      category: '',
      price: 0,
      stock: 100,
      taste_sweet: 3,
      taste_salty: 3,
      taste_spicy: 2,
      contains_nuts: 0,
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
          <h1 className="text-3xl font-bold text-gray-900">零食管理</h1>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
        >
          + 添加零食
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">名称</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">分类</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">价格</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">库存</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">口味</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {snacks.map((snack) => (
              <tr key={snack.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{snack.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">{snack.description}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">{snack.category}</td>
                <td className="px-6 py-4 text-gray-900 font-medium">¥{snack.price}</td>
                <td className="px-6 py-4 text-gray-600">{snack.stock}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2 text-xs">
                    <span className={`px-2 py-1 rounded ${snack.taste_sweet >= 3 ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-400'}`}>
                      甜{snack.taste_sweet}
                    </span>
                    <span className={`px-2 py-1 rounded ${snack.taste_salty >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}>
                      咸{snack.taste_salty}
                    </span>
                    <span className={`px-2 py-1 rounded ${snack.taste_spicy >= 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                      辣{snack.taste_spicy}
                    </span>
                    {snack.contains_nuts ? (
                      <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">坚果</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleEdit(snack)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(snack.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingSnack ? '编辑零食' : '添加零食'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">甜度</label>
                  <input
                    type="number"
                    value={formData.taste_sweet}
                    onChange={(e) => setFormData({ ...formData, taste_sweet: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="0"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">咸度</label>
                  <input
                    type="number"
                    value={formData.taste_salty}
                    onChange={(e) => setFormData({ ...formData, taste_salty: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="0"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">辣度</label>
                  <input
                    type="number"
                    value={formData.taste_spicy}
                    onChange={(e) => setFormData({ ...formData, taste_spicy: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="0"
                    max="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">含坚果</label>
                  <select
                    value={formData.contains_nuts}
                    onChange={(e) => setFormData({ ...formData, contains_nuts: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value={0}>不含</option>
                    <option value={1}>含有</option>
                  </select>
                </div>
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
