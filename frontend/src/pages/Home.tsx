import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          每月一盒，惊喜不断
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          根据你的口味偏好，精选全球美味零食。每月新鲜搭配，越吃越懂你。
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/plans"
            className="bg-primary-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            立即订阅
          </Link>
          {!user && (
            <Link
              to="/register"
              className="border-2 border-primary-500 text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              免费注册
            </Link>
          )}
        </div>
      </section>

      <section className="py-16 bg-white rounded-2xl shadow-sm mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          为什么选择零食盒子？
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">智能推荐</h3>
            <p className="text-gray-600">
              根据你的口味偏好和历史评分，AI算法越来越懂你
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">每月惊喜</h3>
            <p className="text-gray-600">
              每月精选不同零食组合，每次开箱都是惊喜
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">超值性价比</h3>
            <p className="text-gray-600">
              精选全球零食，订阅价比单买省更多
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          三步开启美味之旅
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">注册填写口味</h3>
            <p className="text-gray-600">
              告诉我们你喜欢甜的还是咸的，能不能吃辣
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">选择订阅方案</h3>
            <p className="text-gray-600">
              从尝鲜到尊享，总有一款适合你
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">坐等惊喜上门</h3>
            <p className="text-gray-600">
              每月按时送达，开箱有惊喜
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary-500 to-orange-400 rounded-2xl text-white text-center">
        <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
        <p className="text-xl mb-8 opacity-90">首月订阅立享9折优惠</p>
        <Link
          to="/plans"
          className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
        >
          查看订阅方案
        </Link>
      </section>
    </div>
  );
}
