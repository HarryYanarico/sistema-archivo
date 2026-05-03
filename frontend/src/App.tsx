import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UsersPage from './pages/UsersPage';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-surface-100 flex items-center justify-center">
        <div className="text-surface-600 text-lg font-medium">Cargando...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isAdmin = user?.groups.some((g) => g.name === 'Administrador') ?? false;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-surface-100 flex items-center justify-center">
        <div className="text-surface-600 text-lg font-medium">Cargando...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-surface-100 flex items-center justify-center">
        <div className="text-surface-600 text-lg font-medium">Cargando...</div>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expedientes"
          element={
            <ProtectedRoute>
              <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">
                <p className="text-lg font-medium">Página de Expedientes</p>
                <p className="text-sm mt-1">Próximamente</p>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/prestamos"
          element={
            <ProtectedRoute>
              <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">
                <p className="text-lg font-medium">Página de Préstamos</p>
                <p className="text-sm mt-1">Próximamente</p>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ubicaciones"
          element={
            <ProtectedRoute>
              <div className="glass-panel rounded-2xl p-8 text-center text-surface-500">
                <p className="text-lg font-medium">Página de Ubicaciones</p>
                <p className="text-sm mt-1">Próximamente</p>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
