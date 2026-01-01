import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { TicketsPage } from "./pages/TicketsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ManageAdminsPage } from "./pages/ManageAdminsPage";
import { FakultasTicketsPage } from "./pages/FakultasTicketsPage";
import { AssignmentsPage } from "./pages/AssignmentsPage";
import { Toaster } from "./components/ui/sonner";
// Dashboard untuk Admin/Superadmin
import { Sidebar } from "./components/Sidebar";
import { TicketOverview } from "./components/TicketOverview";
import { RecentActivity } from "./components/RecentActivity";
import { PriorityTickets } from "./components/PriorityTickets";
// Dashboard untuk Fakultas
import { FakultasSidebar } from "./components/FakultasSidebar";
import { FakultasTicketOverview } from "./components/FakultasTicketOverview";
import { FakultasRecentActivity } from "./components/FakultasRecentActivity";
import { FakultasPriorityTickets } from "./components/FakultasPriorityTickets";
// Admin Dashboard Layout + Home Content
function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const currentPath = location.pathname;
  
  const resolveSection = () => {
    if (currentPath === '/admin' || currentPath === '/admin/') return 'dashboard';
    if (currentPath.startsWith('/admin/tickets')) return 'tickets';
    if (currentPath.startsWith('/admin/assignments')) return 'assignments';
    if (currentPath.startsWith('/admin/settings')) return 'settings';
    if (currentPath.startsWith('/admin/admins')) return 'manage-admins';
    return 'dashboard';
  };
  const handleNavigate = (target) => {
    const relative = {
      dashboard: '',
      tickets: '/tickets',
      settings: '/settings',
      'manage-admins': '/admins',
      assignments: '/assignments',
    };
    const suffix = relative[target] ?? '';
    navigate(`/admin${suffix}`);
  };
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (<div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPage={resolveSection()} onNavigate={handleNavigate} onLogout={handleLogout}/>
      <main className="flex-1 min-h-screen p-6 bg-gray-50">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>);
}
function AdminHome() {
  return (<div className="space-y-6">
      <TicketOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <PriorityTickets />
      </div>
    </div>);
}
// Fakultas Dashboard Layout + Home Content
function FakultasLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const currentPath = location.pathname;
  const resolveSection = () => {
    if (currentPath === '/fakultas' || currentPath === '/fakultas/') return 'dashboard';
    if (currentPath.startsWith('/fakultas/tickets')) return 'tickets';
    if (currentPath.startsWith('/fakultas/settings')) return 'settings';
    return 'dashboard';
  };
  const handleNavigate = (target) => {
    const relative = {
      dashboard: '',
      tickets: '/tickets',
      settings: '/settings',
    };
    const suffix = relative[target] ?? '';
    navigate(`/fakultas${suffix}`);
  };
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  return (<div className="min-h-screen bg-gray-50 flex">
      <FakultasSidebar currentPage={resolveSection()} onNavigate={handleNavigate} fakultasName={user?.faculty?.name || 'Admin Fakultas'} userEmail={user?.email || ''} onLogout={handleLogout}/>
      <main className="flex-1 min-h-screen p-6">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>);
}
function FakultasHome() {
  return (<div className="space-y-6">
      <FakultasTicketOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FakultasRecentActivity />
        <FakultasPriorityTickets />
      </div>
    </div>);
}
export default function App() {
    return (<AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />}/>
          <Route path="/login" element={<LoginPage />}/>

          {/* Protected routes - Admin only */}
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminLayout />
              </ProtectedRoute>}>
            <Route index element={<AdminHome />}/>
            <Route path="tickets" element={<TicketsPage />}/>
            <Route path="tickets/:id" element={<TicketDetailPage />}/>
            <Route path="assignments" element={<AssignmentsPage />}/>
            <Route path="settings" element={<SettingsPage />}/>
            <Route path="admins" element={<ManageAdminsPage />}/>
          </Route>

          {/* Protected routes - Fakultas only */}
          <Route path="/fakultas/*" element={<ProtectedRoute allowedRoles={['fakultas', 'admin_fakultas']}>
                <FakultasLayout />
              </ProtectedRoute>}>
            <Route index element={<FakultasHome />}/>
            <Route path="tickets" element={<FakultasTicketsPage />}/>
            <Route path="tickets/:id" element={<TicketDetailPage />}/>
            <Route path="settings" element={<SettingsPage />}/>
          </Route>

          {/* Redirect any unmatched route to home */}
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
        <Toaster position="top-right"/>
      </Router>
    </AuthProvider>);
}
