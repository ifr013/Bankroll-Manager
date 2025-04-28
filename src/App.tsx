import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy-loaded components
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const PlayerDashboard = lazy(() => import('./pages/player/Dashboard'));
const SystemDetails = lazy(() => import('./pages/admin/SystemDetails'));
const CreateSystem = lazy(() => import('./pages/admin/CreateSystem'));
const WeeklySettlement = lazy(() => import('./pages/admin/WeeklySettlement'));
const PlayerSystemView = lazy(() => import('./pages/player/SystemView'));
const AddResults = lazy(() => import('./pages/player/AddResults'));
const Profile = lazy(() => import('./pages/common/Profile'));
const NotFoundPage = lazy(() => import('./pages/common/NotFound'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/systems/create" element={<CreateSystem />} />
            <Route path="/admin/systems/:systemId" element={<SystemDetails />} />
            <Route path="/admin/systems/:systemId/settlement" element={<WeeklySettlement />} />
          </Route>
          
          {/* Protected Player routes */}
          <Route element={<ProtectedRoute allowedRoles={['player']} />}>
            <Route path="/player" element={<PlayerDashboard />} />
            <Route path="/player/systems/:systemId" element={<PlayerSystemView />} />
            <Route path="/player/systems/:systemId/add-results" element={<AddResults />} />
          </Route>
          
          {/* Common protected routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'player']} />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          {/* Redirect and 404 */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;