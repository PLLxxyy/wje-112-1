import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🍿</span>
            <span className="text-xl font-bold text-primary-600">零食盒子</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/plans" className="text-gray-600 hover:text-primary-600 transition-colors">
              订阅方案
            </Link>

            {user ? (
              <>
                <Link to="/subscription" className="text-gray-600 hover:text-primary-600 transition-colors">
                  我的订阅
                </Link>
                
                {isAdmin && (
                  <Link to="/admin" className="text-gray-600 hover:text-primary-600 transition-colors">
                    商家后台
                  </Link>
                )}

                <div className="flex items-center space-x-3">
                  <span className="text-gray-700">Hi, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                  >
                    退出
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  免费注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
