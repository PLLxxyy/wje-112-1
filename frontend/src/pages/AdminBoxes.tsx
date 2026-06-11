import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Box {
  id: string;
  user_id: string;
  user_name: string;
  plan_name: string;
  month: string;
  year: number;
  status: string;
  shipped_at: string;
  delivered_at: string;
  tracking_number: string;
  logistics_company: string;
  created_at: string;
}

export default function AdminBoxes() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [logisticsCompany, setLogisticsCompany] = useState('顺丰速运');

  useEffect(() => {
    loadBoxes();
  }, [statusFilter]);

  const loadBoxes = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/admin/boxes' 
        : `/admin/boxes?status=${statusFilter}`;
      const res = await api.get(url);
      setBoxes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async () => {
    if (!selectedBox) return;
    
    try {
      await api.post(`/admin/boxes/${selectedBox.id}/ship`, {
        tracking_number: trackingNumber,
        logistics_company: logisticsCompany,
      });
      setShowShipModal(false);
      setSelectedBox(null);
      setTrackingNumber('');
      loadBoxes();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleDeliver = async (boxId: string) => {
    if (!confirm('确定要标记为已送达吗？')) return;
    
    try {
      await api.post(`/admin/boxes/${boxId}/deliver`);
      loadBoxes();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待发货', color: 'bg-gray-100 text-gray-700' },
      shipped: { text: '运输中', color: 'bg-blue-100 text-blue-700' },
      delivered: { text: '已签收', color: 'bg-green-100 text-green-700' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
  };

  const openShipModal = (box: Box) => {
    setSelectedBox(box);
    setTrackingNumber('SF' + Math.random().toString().slice(2, 14).toUpperCase());
    setShowShipModal(true);
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
          <h1 className="text-3xl font-bold text-gray-900">盒子管理</h1>
        </div>
        <div className="flex space-x-2">
          {['all', 'pending', 'shipped', 'delivered'].map((status) => (
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">月份</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">状态</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">物流信息</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {boxes.map((box) => (
              <tr key={box.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{box.user_name}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">{box.plan_name}</td>
                <td className="px-6 py-4 text-gray-600">
                  {box.year}年 {box.month}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusText(box.status).color}`}>
                    {getStatusText(box.status).text}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {box.tracking_number ? (
                    <>
                      <p className="font-mono">{box.tracking_number}</p>
                      <p>{box.logistics_company}</p>
                    </>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {box.status === 'pending' && (
                    <button
                      onClick={() => openShipModal(box)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      发货
                    </button>
                  )}
                  {box.status === 'shipped' && (
                    <button
                      onClick={() => handleDeliver(box.id)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      标记签收
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {boxes.length === 0 && (
          <p className="text-center text-gray-500 py-12">暂无盒子数据</p>
        )}
      </div>

      {showShipModal && selectedBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">发货确认</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  物流公司
                </label>
                <input
                  type="text"
                  value={logisticsCompany}
                  onChange={(e) => setLogisticsCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  运单号
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowShipModal(false)}
                className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleShip}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                确认发货
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
