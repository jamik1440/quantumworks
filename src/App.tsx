import React, { useState } from 'react';
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
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

const NavBar: React.FC = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const toggleLanguage = () => {
        setLanguage(language === 'uz' ? 'en' : 'uz');
    };

    return (
        <nav className="relative bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">
                            QuantumWorks
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-8">
                        <Link to="/jobs" className="text-gray-700 hover:text-purple-700 font-medium">{t.nav.findWork}</Link>
                        {isAuthenticated && (
                            <Link to="/post-job" className="text-gray-700 hover:text-purple-700 font-medium">{t.nav.hireTalent}</Link>
                        )}

                        <button
                            onClick={toggleLanguage}
                            className="text-gray-500 hover:text-purple-700 font-semibold uppercase text-sm"
                        >
                            {language === 'uz' ? 'EN' : 'UZ'}
                        </button>

                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <Link to="/dashboard" className="text-gray-700 hover:text-purple-700 font-medium">{t.nav.dashboard}</Link>
                                {user?.role === 'admin' && <Link to="/admin" className="text-gray-700 hover:text-purple-700 font-medium">Admin</Link>}
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    {t.nav.logout}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-purple-700 font-bold hover:text-purple-900">
                                    {t.nav.login}
                                </Link>
                                <Link to="/register" className="px-4 py-2 text-sm font-bold text-white bg-purple-700 rounded-md hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                                    {t.nav.join}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={toggleLanguage}
                            className="mr-4 text-gray-500 hover:text-purple-700 font-semibold uppercase text-sm"
                        >
                            {language === 'uz' ? 'EN' : 'UZ'}
                        </button>
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-purple-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Icon for menu */}
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 shadow-lg absolute w-full z-50">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link to="/jobs" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50">{t.nav.findWork}</Link>
                        {isAuthenticated && (
                            <Link to="/post-job" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50">{t.nav.hireTalent}</Link>
                        )}

                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50">{t.nav.dashboard}</Link>
                                {user?.role === 'admin' && <Link to="/admin" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50">Admin</Link>}
                                <button
                                    onClick={() => { logout(); closeMenu(); }}
                                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    {t.nav.logout}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50">{t.nav.login}</Link>
                                <Link to="/register" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-white bg-purple-700 hover:bg-purple-800">{t.nav.join}</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AuthProvider>
                <Router>
                    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
                        <NavBar />
                        <main className="flex-1">
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

                        <footer className="bg-slate-800 text-white py-8 text-center">
                            <p>© 2024 QuantumWorks. AI-Powered Freelance Marketplace.</p>
                            <p className="text-sm text-slate-400 mt-2">Secure Escrow • Smart Matching • Verified Talent</p>
                        </footer>
                    </div>
                </Router>
            </AuthProvider>
        </LanguageProvider>
    );
};

export default App;
