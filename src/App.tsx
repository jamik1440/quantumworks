import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import CreateJobPage from './pages/CreateJobPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const NavBar: React.FC = () => {
    const { isAuthenticated, logout, user } = useAuth();

    return (
        <nav style={{ padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #6b21a8, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                QuantumWorks
            </Link>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <Link to="/jobs" style={{ textDecoration: 'none', color: '#333' }}>Jobs</Link>
                {isAuthenticated && (
                    <Link to="/post-job" style={{ textDecoration: 'none', color: '#333' }}>Post a Job</Link>
                )}

                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333' }}>Dashboard</Link>
                        {user?.role === 'admin' && <Link to="/admin" style={{ textDecoration: 'none', color: '#333' }}>Admin</Link>}
                        <button
                            onClick={logout}
                            style={{
                                background: 'transparent',
                                border: '1px solid #dc2626',
                                color: '#dc2626',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{
                            textDecoration: 'none',
                            color: '#6b21a8',
                            fontWeight: 'bold',
                            padding: '0.5rem 1rem',
                            border: '1px solid #6b21a8',
                            borderRadius: '6px'
                        }}>
                            Login
                        </Link>
                        <Link to="/register" style={{
                            textDecoration: 'none',
                            color: 'white',
                            backgroundColor: '#6b21a8',
                            fontWeight: 'bold',
                            padding: '0.5rem 1rem',
                            border: '1px solid #6b21a8',
                            borderRadius: '6px'
                        }}>
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
                    <NavBar />
                    <main style={{ flex: 1, background: '#f8fafc' }}>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/jobs" element={<JobsPage />} />
                            <Route path="/jobs/:id" element={<JobDetailsPage />} />
                            <Route path="/post-job" element={<CreateJobPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/admin" element={<AdminPage />} />
                        </Routes>
                    </main>

                    <footer style={{ background: '#1e293b', color: 'white', padding: '2rem', textAlign: 'center' }}>
                        <p>© 2024 QuantumWorks. AI-Powered Freelance Marketplace.</p>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Secure Escrow • Smart Matching • Verified Talent</p>
                    </footer>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App;
