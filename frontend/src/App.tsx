import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PreferenceQuiz from './pages/PreferenceQuiz';
import Plans from './pages/Plans';
import Subscription from './pages/Subscription';
import BoxDetail from './pages/BoxDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminSnacks from './pages/AdminSnacks';
import AdminPlans from './pages/AdminPlans';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminBoxes from './pages/AdminBoxes';

function App() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/preferences" element={user ? <PreferenceQuiz /> : <Navigate to="/login" />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/subscription" element={user ? <Subscription /> : <Navigate to="/login" />} />
          <Route path="/boxes/:id" element={user ? <BoxDetail /> : <Navigate to="/login" />} />
          
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/admin/snacks" element={isAdmin ? <AdminSnacks /> : <Navigate to="/" />} />
          <Route path="/admin/plans" element={isAdmin ? <AdminPlans /> : <Navigate to="/" />} />
          <Route path="/admin/subscriptions" element={isAdmin ? <AdminSubscriptions /> : <Navigate to="/" />} />
          <Route path="/admin/boxes" element={isAdmin ? <AdminBoxes /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
