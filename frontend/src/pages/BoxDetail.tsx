import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

interface Snack {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  quantity: number;
  user_rating: {
    rating: number;
    comment: string;
  } | null;
}

interface BoxDetail {
  id: string;
  month: string;
  year: number;
  status: string;
  shipped_at: string;
  delivered_at: string;
  tracking_number: string;
  logistics_company: string;
  snacks: Snack[];
}

interface LogisticsTimeline {
  status: string;
  time: string;
  description: string;
}

export default function BoxDetail() {
  const { id } = useParams<{ id: string }>();
  const [box, setBox] = useState<BoxDetail | null>(null);
  const [logistics, setLogistics] = useState<{ timeline: LogisticsTimeline[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingSnack, setRatingSnack] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const ratingLabels = ['很差', '一般', '还行', '喜欢', '超爱'];

  useEffect(() => {
    if (id) {
      loadBoxDetail();
      loadLogistics();
    }
  }, [id]);

  const loadBoxDetail = async () => {
    try {
      const res = await api.get(`/boxes/${id}`);
      setBox(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogistics = async () => {
    try {
      const res = await api.get(`/boxes/${id}/logistics`);
      setLogistics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRate = async (snackId: string) => {
    try {
      await api.post(`/boxes/${id}/rate/${snackId}`, {
        rating: ratingValue,
        comment: ratingComment,
      });
      setRatingSnack(null);
      setRatingComment('');
      loadBoxDetail();
    } catch (err: any) {
      alert(err.response?.data?.error || '评分失败');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '准备中', color: 'bg-gray-100 text-gray-700' },
      shipped: { text: '运输中', color: 'bg-blue-100 text-blue-700' },
      delivered: { text: '已签收', color: 'bg-green-100 text-green-700' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
  };

  const renderStars = (rating: number, interactive: boolean = false, onClick?: (r: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onClick?.(star)}
            className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            disabled={!interactive}
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">盒子不存在</p>
        <Link to="/subscription" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          返回订阅页面
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/subscription" className="text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← 返回订阅管理
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {box.year}年 {box.month} 零食盒
          </h1>
          <p className="text-gray-500 mt-1">共 {box.snacks.length} 款零食</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusText(box.status).color}`}>
          {getStatusText(box.status).text}
        </span>
      </div>

      {logistics && (
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">物流状态</h3>
          <div className="space-y-4">
            {logistics.timeline.map((item, index) => (
              <div key={index} className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    index === logistics.timeline.length - 1 ? 'bg-primary-500' : 'bg-gray-300'
                  }`}></div>
                  {index < logistics.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 flex-1"></div>
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-gray-900">{item.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.time).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {box.tracking_number && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">运单号</p>
              <p className="font-mono text-gray-900">{box.tracking_number}</p>
              <p className="text-sm text-gray-500 mt-1">{box.logistics_company}</p>
            </div>
          )}
        </div>
      )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">本期零食清单</h2>
        
        {box.snacks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无零食清单</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {box.snacks.map((snack) => (
              <div key={snack.id} className="flex p-4 bg-gray-50 rounded-xl">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                  🍪
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-semibold text-gray-900">{snack.name}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{snack.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-400">x{snack.quantity}</span>
                    {snack.user_rating ? (
                      <div className="flex items-center space-x-2">
                        {renderStars(snack.user_rating.rating)}
                        <span className="text-sm text-gray-500">我的评分</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRatingSnack(snack.id);
                          setRatingValue(5);
                          setRatingComment('');
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        去评分
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ratingSnack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">为这款零食评分</h3>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                {box.snacks.find(s => s.id === ratingSnack)?.name}
              </p>
              {renderStars(ratingValue, true, setRatingValue)}
              <p className="text-sm text-gray-500 mt-2">
                {ratingLabels[ratingValue - 1]}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                评价（可选）
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="说说你的感受..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setRatingSnack(null)}
                className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleRate(ratingSnack)}
                className="flex-1 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                提交评分
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
