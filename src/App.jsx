import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Events } from './pages/public/Events';
import { EventDetails } from './pages/public/EventDetails';
import { Gallery } from './pages/public/Gallery';
import { Team } from './pages/public/Team';
import { Contact } from './pages/public/Contact';
import { Results } from './pages/public/Results';
import { LiveEvents as PublicLiveEvents } from './pages/public/LiveEvents';
import { EventRegistration } from './pages/public/EventRegistration';

// Auth Pages
import { Login } from './pages/auth/Login';
import { SetupAdmin } from './pages/auth/SetupAdmin';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { EventsManagement } from './pages/admin/EventsManagement';
import { JuryManagement } from './pages/admin/JuryManagement';
import { ParticipantsManagement } from './pages/admin/ParticipantsManagement';
import { ResultsManagement } from './pages/admin/ResultsManagement';
import { ContentManagement } from './pages/admin/ContentManagement';
import { LiveEvents as AdminLiveEvents } from './pages/admin/LiveEvents';
import { AdminGallery } from './pages/admin/AdminGallery';
import { AdminContact } from './pages/admin/AdminContact';
import { AdminTeam } from './pages/admin/AdminTeam';
import { AdminSettings } from './pages/admin/AdminSettings';

<Route
  path="/admin/admins"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminSettings />
    </ProtectedRoute>
  }
/>
import { JuryDashboard } from './pages/jury/Dashboard';
import { EventEvaluation } from './pages/jury/EventEvaluation';
import { TeamSelection } from './pages/jury/TeamSelection';
import { ScoringInterface } from './pages/jury/ScoringInterface';

// Layout Wrapper for Public Pages
const PublicLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
};

// Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user, userProfile, loading } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [fixing, setFixing] = useState(false);

  // If we are definitely an admin/jury, redirect
  if (userProfile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (userProfile?.role === 'jury') {
    return <Navigate to="/jury" replace />;
  } else if (userProfile?.role === 'student_coordinator') {
    return <Navigate to="/admin/participants" replace />;
  }

  // If no user at all, go home
  if (!user && !loading) return <Navigate to="/" replace />;

  const handleRetry = () => {
    setRetrying(true);
    window.location.reload();
  };

  const handleAutoFix = async () => {
    if (!user) return;
    setFixing(true);
    try {
      console.log('Attempting to auto-fix profile for:', user.id);
      const { error } = await supabase.from('users').insert([
        {
          id: user.id,
          email: user.email,
          full_name: user.email.split('@')[0],
          role: 'jury', // Auto-grant jury for recovery
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      // If successful, force reload to pick up new profile
      toast.success("Profile recovered! Redirecting...");
      setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
      console.error("Auto-fix failed:", err);
      toast.error("Auto-fix failed: " + err.message);
      setFixing(false);
    }
  };

  // Debugging: Show why redirect failed
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Status</h2>
        <p className="text-gray-600 mb-4">
          We could not determine your dashboard permissions.
        </p>
        <div className="bg-gray-100 p-4 rounded mb-6 text-left text-sm font-mono text-wrap break-all">
          <p><strong>Auth Email:</strong> {user?.email || 'No Auth User'}</p>
          <p><strong>Profile Email:</strong> {userProfile?.email || 'Missing Profile'}</p>
          <p><strong>Role:</strong> {userProfile?.role || 'Undefined'}</p>
          <p><strong>UID:</strong> {user?.id || '...'}</p>
        </div>

        {(user && !userProfile) && (
          <div className="mb-6 p-3 bg-blue-50 text-blue-700 rounded text-sm">
            <strong>Missing Profile Detected</strong><br />
            Your account exists but is missing its profile data.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {(user && !userProfile) && (
            <button
              onClick={handleAutoFix}
              disabled={fixing}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold shadow-sm"
            >
              {fixing ? 'Recovering...' : 'Auto-Fix My Profile'}
            </button>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="text-primary-600 hover:text-primary-800 font-medium px-4 py-2 border border-primary-200 rounded"
              disabled={retrying}
            >
              {retrying ? 'Retrying...' : 'Retry Connection'}
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/events" element={<PublicLayout><Events /></PublicLayout>} />
            <Route path="/events/:id" element={<PublicLayout><EventDetails /></PublicLayout>} />
            <Route path="/events/:id/register" element={<PublicLayout><EventRegistration /></PublicLayout>} />
            <Route path="/gallery" element={<PublicLayout><Gallery /></PublicLayout>} />
            <Route path="/team" element={<PublicLayout><Team /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            <Route path="/results" element={<PublicLayout><Results /></PublicLayout>} />
            <Route path="/live-events" element={<PublicLayout><PublicLiveEvents /></PublicLayout>} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<SetupAdmin />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EventsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jury"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <JuryManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contact"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminContact />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/participants"
              element={
                <ProtectedRoute allowedRoles={['admin', 'student_coordinator']}>
                  <ParticipantsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/results"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ResultsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/content"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ContentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/live-events"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLiveEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/gallery"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminGallery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/team"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/admins"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Jury Routes */}
            <Route
              path="/jury"
              element={
                <ProtectedRoute allowedRoles={['jury']}>
                  <JuryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jury/event/:eventId"
              element={
                <ProtectedRoute allowedRoles={['jury']}>
                  <EventEvaluation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jury/event/:eventId/teams"
              element={
                <ProtectedRoute allowedRoles={['jury']}>
                  <TeamSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jury/event/:eventId/score/:registrationId"
              element={
                <ProtectedRoute allowedRoles={['jury']}>
                  <ScoringInterface />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
