import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Sprints from './pages/Sprints';
import Analytics from './pages/Analytics';
import Team from './pages/Team';
import CIPipeline from './pages/CIPipeline';
import AuditLog from './pages/AuditLog';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <div className="app-loading" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="board"      element={<Kanban />} />
          <Route path="sprints"    element={<Sprints />} />
          <Route path="analytics"  element={<Analytics />} />
          <Route path="team"       element={<Team />} />
          <Route path="pipeline"   element={<CIPipeline />} />
          <Route path="audit"      element={<AuditLog />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
