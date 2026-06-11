import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PreferenceQuiz() {
  const [step, setStep] = useState(1);
  const [sweet, setSweet] = useState(3);
  const [salty, setSalty] = useState(3);
  const [spicy, setSpicy] = useState(2);
  const [nutAllergy, setNutAllergy] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/preferences').then((res) => {
      if (res.data.preferences_set) {
        setSweet(res.data.taste_sweet);
        setSalty(res.data.taste_salty);
        setSpicy(res.data.taste_spicy);
        setNutAllergy(res.data.nut_allergy);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/preferences', {
        taste_sweet: sweet,
        taste_salty: salty,
        taste_spicy: spicy,
        nut_allergy: nutAllergy,
      });
      
      const userRes = await api.get('/auth/profile');
      updateUser(userRes.data);
      
      navigate('/plans');
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">你有多喜欢甜食？</h3>
            <p className="text-gray-500 mb-8">1分表示完全不喜欢，5分表示超级喜欢</p>
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setSweet(score)}
                  className={`w-14 h-14 rounded-full text-lg font-semibold transition-all ${
                    sweet === score
                      ? 'bg-primary-500 text-white scale-110'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-400 px-8">
              <span>不喜欢甜</span>
              <span>超级爱甜</span>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">你有多喜欢咸食？</h3>
            <p className="text-gray-500 mb-8">薯片、坚果、肉干都是咸口的代表</p>
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setSalty(score)}
                  className={`w-14 h-14 rounded-full text-lg font-semibold transition-all ${
                    salty === score
                      ? 'bg-primary-500 text-white scale-110'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-400 px-8">
              <span>不喜欢咸</span>
              <span>越咸越好</span>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">你能吃辣吗？</h3>
            <p className="text-gray-500 mb-8">微辣、中辣还是变态辣？</p>
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setSpicy(score)}
                  className={`w-14 h-14 rounded-full text-lg font-semibold transition-all ${
                    spicy === score
                      ? 'bg-primary-500 text-white scale-110'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-400 px-8">
              <span>完全不能吃辣</span>
              <span>无辣不欢</span>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">你对坚果过敏吗？</h3>
            <p className="text-gray-500 mb-8">我们会确保你的盒子里不含坚果</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setNutAllergy(0)}
                className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                  nutAllergy === 0
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                不过敏
              </button>
              <button
                onClick={() => setNutAllergy(1)}
                className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                  nutAllergy === 1
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                过敏
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-16">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="min-h-[200px] flex items-center justify-center">
          {renderStep()}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一步
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '完成，查看推荐'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
