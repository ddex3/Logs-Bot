import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Dashboard from './pages/Dashboard';
import ServerPanel from './pages/ServerPanel';
import Discord from './pages/Discord';
import Invite from './pages/Invite';
import Commands from './pages/Commands';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import RouteGuard from './components/RouteGuard';
import { NotFoundHandler } from './utils/errorHandler';
import Error400 from './pages/errors/Error400';
import Error401 from './pages/errors/Error401';
import Error403 from './pages/errors/Error403';
import Error404 from './pages/errors/Error404';
import Error405 from './pages/errors/Error405';
import Error408 from './pages/errors/Error408';
import Error409 from './pages/errors/Error409';
import Error410 from './pages/errors/Error410';
import Error418 from './pages/errors/Error418';
import Error429 from './pages/errors/Error429';
import Error500 from './pages/errors/Error500';
import Error501 from './pages/errors/Error501';
import Error502 from './pages/errors/Error502';
import Error503 from './pages/errors/Error503';
import Error504 from './pages/errors/Error504';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <RouteGuard>
            <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col transition-colors duration-300">
              <Header />
              <main className="flex-1 overflow-x-hidden">
                <Routes>
                <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                <Route path="/discord" element={<Discord />} />
                <Route path="/invite" element={<Invite />} />
                <Route path="/commands" element={<PageTransition><Commands /></PageTransition>} />
                <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
                <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <PageTransition><Dashboard /></PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:guildId/dashboard"
                  element={
                    <ProtectedRoute>
                      <PageTransition><ServerPanel /></PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:guildId/dashboard/transcripts/:transcriptId"
                  element={
                    <ProtectedRoute>
                      <PageTransition><ServerPanel /></PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:guildId/dashboard/:tab"
                  element={
                    <ProtectedRoute>
                      <PageTransition><ServerPanel /></PageTransition>
                    </ProtectedRoute>
                  }
                />
                <Route path="/error/400" element={<Error400 />} />
                <Route path="/error/401" element={<Error401 />} />
                <Route path="/error/403" element={<Error403 />} />
                <Route path="/error/404" element={<Error404 />} />
                <Route path="/error/405" element={<Error405 />} />
                <Route path="/error/408" element={<Error408 />} />
                <Route path="/error/409" element={<Error409 />} />
                <Route path="/error/410" element={<Error410 />} />
                <Route path="/error/418" element={<Error418 />} />
                <Route path="/error/429" element={<Error429 />} />
                <Route path="/error/500" element={<Error500 />} />
                <Route path="/error/501" element={<Error501 />} />
                <Route path="/error/502" element={<Error502 />} />
                <Route path="/error/503" element={<Error503 />} />
                <Route path="/error/504" element={<Error504 />} />
                <Route path="/env" element={<Error403 />} />
                <Route path="/env/*" element={<Error403 />} />
                <Route path="/.env*" element={<Error403 />} />
                <Route path="/.git*" element={<Error403 />} />
                <Route path="/node_modules/*" element={<Error403 />} />
                <Route path="/package.json" element={<Error403 />} />
                <Route path="/package-lock.json" element={<Error403 />} />
                <Route path="/tsconfig.json" element={<Error403 />} />
                <Route path="/vite.config.*" element={<Error403 />} />
                <Route path="/src/*" element={<NotFoundHandler />} />
                <Route path="*" element={<NotFoundHandler />} />
              </Routes>
            </main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 2500,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '0.5px solid var(--toast-border)',
                  borderRadius: '7px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '12px 16px',
                  minWidth: '280px',
                  maxWidth: '280px',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                  style: {
                    background: 'var(--toast-success-bg)',
                    color: 'var(--toast-success-color)',
                    border: '0.5px solid var(--toast-success-border)',
                    minWidth: '280px',
                    maxWidth: '280px',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                  style: {
                    background: 'var(--toast-error-bg)',
                    color: 'var(--toast-error-color)',
                    border: '0.5px solid var(--toast-error-border)',
                    minWidth: '280px',
                    maxWidth: '280px',
                  },
                },
              }}
            />
            </div>
          </RouteGuard>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;