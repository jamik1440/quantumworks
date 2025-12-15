import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import PostProject from './pages/PostProject';
import AdminDashboard from './pages/AdminDashboard';
import SupportWidget from './components/SupportWidget';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './contexts/ToastContext';
import { MarketplaceProvider } from './contexts/MarketplaceContext';

const PageWrapper = ({ children }: { children?: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children, role }: { children?: React.ReactNode, role?: string }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-nexus-cyan">Initializing Quantum Protocol...</div>;
  if (!isAuthenticated) return <Navigate to="/login-register" />;
  if (role && user?.role !== role) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={
            <PageWrapper>
              <Hero />
              <div className="relative z-10 bg-black border-t border-white/10">
                <div className="pt-20 pb-10 text-center">
                  <h3 className="text-2xl font-bold mb-2 text-white">Featured Quantum Opportunities</h3>
                  <p className="text-gray-500">A glimpse into the high-frequency talent network</p>
                </div>
                <Marketplace />
              </div>
              <footer className="border-t border-white/10 bg-black py-12 text-center text-gray-500 text-sm">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>© 2024 QuantumWorks Inc. All rights reserved.</div>
                  <div className="flex gap-6">
                    <a href="#" className="hover:text-nexus-cyan transition-colors">Quantum Protocols</a>
                    <a href="#" className="hover:text-nexus-cyan transition-colors">Terms of Node Access</a>
                    <a href="#" className="hover:text-nexus-cyan transition-colors">Smart Contracts</a>
                  </div>
                </div>
              </footer>
            </PageWrapper>
          } />
          <Route path="/marketplace" element={
            <PageWrapper>
              <div className="bg-black min-h-screen">
                <Marketplace />
              </div>
            </PageWrapper>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <PageWrapper>
                <Profile />
              </PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/profile/edit" element={
            <ProtectedRoute>
              <PageWrapper>
                <EditProfile />
              </PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/login-register" element={
            <PageWrapper>
              <Auth />
            </PageWrapper>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PageWrapper>
                <Dashboard />
              </PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/post-project" element={
            <ProtectedRoute role="employer">
              <PageWrapper>
                <PostProject />
              </PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <PageWrapper>
                <AdminDashboard />
              </PageWrapper>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LanguageProvider>
          <MarketplaceProvider>
            <ChatProvider>
              <Router>
                <div className="bg-black min-h-screen text-white font-sans selection:bg-nexus-cyan selection:text-black">
                  <Navbar />
                  <AnimatedRoutes />
                  <SupportWidget />
                </div>
              </Router>
            </ChatProvider>
          </MarketplaceProvider>
        </LanguageProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;