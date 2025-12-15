import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Layout, Briefcase, Menu, X, LogOut, LayoutDashboard, Shield, PlusCircle, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import api from '../services/api';

// Live User Count (Quantum Network Node)
const LiveUserCount: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const fetchActiveVisitors = async () => {
    try {
      const response = await api.get('/stats/active-visitors');
      const count = response.data.active_visitors || 0;
      setOnlineUsers(count);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to fetch active visitors:', error);
      // Keep previous connection state on error
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchActiveVisitors();

    // Set up polling to update every 3 seconds
    const interval = setInterval(() => {
      fetchActiveVisitors();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      className={`flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 hover:border-nexus-cyan/30 transition-all duration-300 group cursor-default backdrop-blur-md ${className}`}
      title={isConnected ? "Q-NET Active Nodes" : "Syncing with Quantum Network..."}
    >
      <div className="relative flex h-2.5 w-2.5 items-center justify-center">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-cyan opacity-40 duration-[1.5s]"></span>
        )}
        <span 
          className={`relative inline-flex rounded-full h-2 w-2 transition-all duration-500 ${
            isConnected 
              ? 'bg-nexus-cyan shadow-[0_0_10px_rgba(0,242,255,0.6)]' 
              : 'bg-nexus-magenta animate-pulse'
          }`}
        ></span>
      </div>
      <div className="flex flex-col justify-center h-full leading-none space-y-0.5">
         <span className="text-[10px] uppercase font-bold text-gray-600 group-hover:text-nexus-cyan transition-colors tracking-wider">
            {isConnected ? 'Q-NET' : 'SYNC'}
         </span>
         <span className="text-xs font-mono text-gray-400 group-hover:text-gray-300 transition-colors flex items-center gap-1.5">
           <span className={`font-bold tabular-nums transition-colors duration-300 ${isConnected ? 'text-white' : 'text-gray-500'}`}>
              {onlineUsers.toLocaleString()}
           </span>
           <span>Nodes</span>
         </span>
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
  ];
  
  const currentLang = languages.find(l => l.code === language);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Zod schema for language validation
  const languageSchema = z.enum(['en', 'ru', 'uz']);

  const handleLanguageSelect = (code: string) => {
    const result = languageSchema.safeParse(code);
    if (result.success) {
      setLanguage(result.data as Language);
      setLangOpen(false);
    } else {
      console.error("Invalid language code selected");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/70 border-b border-white/10 h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Logo - QuantumWorks */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer group z-50">
          <div className="w-9 h-9 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-nexus-cyan to-nexus-magenta rounded-lg rotate-45 group-hover:rotate-180 transition-transform duration-500 blur-sm opacity-60"></div>
            <div className="absolute inset-0.5 bg-black rounded-lg rotate-45 flex items-center justify-center border border-white/10 z-10">
               <span className="text-white font-bold text-lg transform -rotate-45 font-mono">Q</span>
            </div>
          </div>
          <div className="flex flex-col">
             <span className="text-xl font-bold tracking-tighter text-white font-sans leading-none">Q-WORKS</span>
             <span className="text-[9px] text-nexus-cyan tracking-[0.2em] font-medium leading-none mt-1 group-hover:text-nexus-magenta transition-colors">QUANTUM</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
           <Link 
             to="/" 
             className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isActive('/') ? 'text-nexus-cyan' : 'text-gray-300 hover:text-white'}`}
           >
             <Layout size={16} />
             {t.nav.home}
           </Link>
           
           {/* Conditional Marketplace Link */}
           <Link 
             to="/marketplace" 
             className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isActive('/marketplace') ? 'text-nexus-cyan' : 'text-gray-300 hover:text-white'}`}
           >
             {isAuthenticated && user?.role === 'freelancer' ? <Search size={16} /> : <Briefcase size={16} />}
             {isAuthenticated && user?.role === 'freelancer' ? t.nav.findWork : t.nav.marketplace}
           </Link>

           {isAuthenticated && (
             <Link 
               to="/dashboard" 
               className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isActive('/dashboard') ? 'text-nexus-cyan' : 'text-gray-300 hover:text-white'}`}
             >
               <LayoutDashboard size={16} />
               {t.nav.dashboard}
             </Link>
           )}

           {/* Admin Role Only */}
           {user?.role === 'admin' && (
             <Link 
               to="/admin" 
               className={`text-sm font-bold flex items-center gap-2 transition-colors ${isActive('/admin') ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
             >
               <Shield size={16} />
               Admin
             </Link>
           )}
           
           {/* Employer Role Only */}
           {user?.role === 'employer' && (
             <Link 
               to="/post-project" 
               className={`text-sm font-bold flex items-center gap-2 transition-colors ${isActive('/post-project') ? 'text-nexus-cyan' : 'text-gray-300 hover:text-white'}`}
             >
               <PlusCircle size={16} />
               Post Job
             </Link>
           )}
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-6">
           
           {/* Live User Count Component */}
           <LiveUserCount className="hidden lg:flex" />

           {/* Language Switcher */}
           <div className="relative z-50">
             <button 
               onClick={() => setLangOpen(!langOpen)}
               className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 px-3 py-2 rounded-lg border outline-none
                 ${langOpen ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-transparent border-transparent text-gray-300 hover:text-white hover:bg-white/5'}
               `}
             >
               <AnimatePresence mode='wait'>
                 <motion.div
                   key={language}
                   initial={{ y: -5, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: 5, opacity: 0 }}
                   transition={{ duration: 0.15 }}
                   className="flex items-center gap-2"
                 >
                   <span className="text-lg leading-none filter drop-shadow-md">{currentLang?.flag}</span>
                   <span className="font-bold tracking-wide uppercase text-xs">{currentLang?.code}</span>
                 </motion.div>
               </AnimatePresence>
               <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${langOpen ? 'rotate-180 text-nexus-cyan' : ''}`} />
             </button>
             
             <AnimatePresence>
               {langOpen && (
                 <motion.div
                   initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(10px)" }}
                   animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                   exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(10px)" }}
                   transition={{ duration: 0.2, ease: "circOut" }}
                   className="absolute top-full right-0 mt-2 w-48 backdrop-blur-2xl bg-[#0a0a0a]/90 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/5 z-[60]"
                 >
                   <div className="p-1.5 grid gap-0.5">
                   <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 mb-1">Select Region</div>
                   {languages.map((lang) => (
                     <button
                       key={lang.code}
                       onClick={() => handleLanguageSelect(lang.code)}
                       className={`relative w-full text-left px-3 py-3 text-sm flex items-center gap-3 rounded-lg transition-all duration-200 group overflow-hidden
                         ${language === lang.code ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                       `}
                     >
                       {/* Active Background Animation */}
                       {language === lang.code && (
                          <motion.div 
                            layoutId="activeLang"
                            className="absolute inset-0 bg-white/10 border border-white/5"
                            transition={{ duration: 0.2 }}
                          />
                       )}
                       
                       <span className="text-xl relative z-10">{lang.flag}</span>
                       <span className="relative z-10 flex-1 font-medium">{lang.label}</span>
                       
                       {/* Active Indicator Dot */}
                       {language === lang.code && (
                         <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-nexus-cyan shadow-[0_0_8px_#00F2FF] relative z-10" 
                         />
                       )}
                     </button>
                   ))}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           <div className="h-6 w-[1px] bg-white/10"></div>

           {isAuthenticated ? (
             <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 text-sm font-bold text-white hover:text-nexus-cyan transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-nexus-cyan to-nexus-magenta p-[2px]">
                     <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                        <User size={14} />
                     </div>
                  </div>
                  {user?.name.split(' ')[0]}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Logout"
                >
                   <LogOut size={18} />
                </button>
             </div>
           ) : (
             <>
               <Link to="/login-register" className="text-sm font-semibold text-white hover:text-nexus-cyan transition-colors">
                 {t.nav.login}
               </Link>
               <Link to="/login-register" className="text-sm font-bold bg-white text-black px-5 py-2 rounded-full hover:bg-nexus-cyan hover:shadow-[0_0_20px_rgba(0,242,255,0.5)] transition-all duration-300">
                 {t.nav.join}
               </Link>
             </>
           )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white hover:text-nexus-cyan transition-colors z-50"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              {...({
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -20 },
                transition: { duration: 0.3 },
                className: "fixed inset-0 top-0 bg-black/95 backdrop-blur-xl z-40 pt-24 px-6 flex flex-col gap-6 md:hidden"
              } as any)}
            >
              <div className="flex flex-col space-y-4">
                 <Link 
                   to="/" 
                   onClick={() => setMobileMenuOpen(false)}
                   className={`text-2xl font-bold flex items-center gap-4 py-4 border-b border-white/10 ${isActive('/') ? 'text-nexus-cyan' : 'text-white'}`}
                 >
                   <Layout size={24} />
                   {t.nav.home}
                 </Link>
                 
                 <Link 
                   to="/marketplace" 
                   onClick={() => setMobileMenuOpen(false)}
                   className={`text-2xl font-bold flex items-center gap-4 py-4 border-b border-white/10 ${isActive('/marketplace') ? 'text-nexus-cyan' : 'text-white'}`}
                 >
                   {isAuthenticated && user?.role === 'freelancer' ? <Search size={24} /> : <Briefcase size={24} />}
                   {isAuthenticated && user?.role === 'freelancer' ? t.nav.findWork : t.nav.marketplace}
                 </Link>

                 {isAuthenticated && (
                   <Link 
                     to="/dashboard" 
                     onClick={() => setMobileMenuOpen(false)}
                     className={`text-2xl font-bold flex items-center gap-4 py-4 border-b border-white/10 ${isActive('/dashboard') ? 'text-nexus-cyan' : 'text-white'}`}
                   >
                     <LayoutDashboard size={24} />
                     {t.nav.dashboard}
                   </Link>
                 )}
                 
                 {user?.role === 'admin' && (
                    <Link 
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)} 
                      className="text-2xl font-bold flex items-center gap-4 py-4 border-b border-white/10 text-red-500"
                    >
                      <Shield size={24} /> Admin
                    </Link>
                 )}

                 {user?.role === 'employer' && (
                   <Link 
                     to="/post-project"
                     onClick={() => setMobileMenuOpen(false)}
                     className="text-2xl font-bold flex items-center gap-4 py-4 border-b border-white/10 text-nexus-cyan"
                   >
                     <PlusCircle size={24} /> Post Job
                   </Link>
                 )}
              </div>

              <div className="flex flex-col gap-4 mt-auto pb-10">
                 {/* Mobile Live User Count Component */}
                 <LiveUserCount className="mx-auto w-fit" />

                <div className="flex gap-4 justify-center">
                   {languages.map((lang) => (
                     <button
                       key={lang.code}
                       onClick={() => {
                           handleLanguageSelect(lang.code);
                       }}
                       className={`px-4 py-2 rounded-lg text-lg ${language === lang.code ? 'bg-nexus-cyan text-black font-bold' : 'bg-white/5 text-gray-400'}`}
                     >
                       {lang.flag} {lang.code.toUpperCase()}
                     </button>
                   ))}
                </div>
                {isAuthenticated ? (
                  <button onClick={handleLogout} className="w-full py-4 text-center font-bold text-white border border-white/20 rounded-xl">
                    {t.nav.logout}
                  </button>
                ) : (
                  <>
                    <Link to="/login-register" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-white border border-white/20 rounded-xl block">
                       {t.nav.login}
                    </Link>
                    <Link to="/login-register" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center font-bold bg-nexus-cyan text-black rounded-xl block">
                       {t.nav.join}
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;