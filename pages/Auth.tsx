
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { UserRole } from '../types';
import { z } from 'zod';
import { Briefcase, User, Mail, Lock, ArrowRight, ArrowLeft, Loader2, Fingerprint, Bird } from 'lucide-react';
import api from '../services/api';

const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [direction, setDirection] = useState(0);
  const [role, setRole] = useState<UserRole>('freelancer');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Schemas
  const loginSchema = z.object({
    email: z.string().email(t.auth.errors.invalidEmail),
    password: z.string().min(1, "Password is required"), // Relaxed for admin check
  });

  const registerSchema = loginSchema.extend({
    name: z.string().min(2, t.auth.errors.nameRequired),
    role: z.enum(['freelancer', 'employer']),
    password: z.string().min(6, t.auth.errors.passwordLength),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setDirection(newMode === 'register' ? 1 : -1);
    setAuthMode(newMode);
    setErrors({});
  };

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    console.log("Starting Auth:", type, formData);

    try {
      if (type === 'login') {
        loginSchema.parse(formData);
        // ... (existing login logic)
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        const userResponse = await api.get('/users/me');
        const backendUser = userResponse.data;
        const mappedUser = {
          id: backendUser.id.toString(),
          name: backendUser.full_name || backendUser.email.split('@')[0],
          email: backendUser.email,
          role: backendUser.role as UserRole,
          ...backendUser
        };
        login(mappedUser, access_token);
        if (mappedUser.role === 'admin') {
          navigate('/admin');
          showToast("Welcome Administrator", "success");
        } else {
          navigate('/dashboard');
          showToast(t.common.success, "success");
        }

      } else {
        console.log("Validating Register");
        registerSchema.parse({ ...formData, role });

        console.log("Sending Register Request");
        // Register Call
        await api.post('/auth/register', {
          email: formData.email,
          password: formData.password,
          full_name: formData.name, // Map name to full_name
          role: role
        });
        console.log("Register Success, Logging in...");

        // Auto Login after Register
        const loginResponse = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        const { access_token } = loginResponse.data;
        localStorage.setItem('token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        const userResponse = await api.get('/users/me');
        const backendUser = userResponse.data;
        const mappedUser = {
          id: backendUser.id.toString(),
          name: backendUser.full_name || backendUser.email.split('@')[0],
          email: backendUser.email,
          role: backendUser.role as UserRole,
          ...backendUser
        };
        login(mappedUser, access_token);
        showToast(t.common.success, "success");
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Fallback alert for debugging if toast fails
      // alert(`Auth Failed: ${err.message || JSON.stringify(err)}`);

      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          if (error.path[0]) newErrors[error.path[0] as string] = error.message;
        });
        setErrors(newErrors);
        showToast(t.common.error, "error");
      } else {
        let msg = err.response?.data?.detail || err.message || "Unknown Error";

        if (Array.isArray(msg)) {
          msg = msg.map((e: any) => e.msg).join(', ');
        } else if (typeof msg === 'object') {
          msg = JSON.stringify(msg);
        }

        showToast(`${type === 'login' ? 'Login' : 'Register'} Failed: ${msg}`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation Variants (Preserved)
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 20 : -20,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 20 : -20,
    })
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden bg-black perspective-[1500px]">

      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-nexus-cyan/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-nexus-magenta/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[440px] h-[650px] relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {authMode === 'login' ? (
            <motion.div
              key="login"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.4 },
                rotateY: { duration: 0.4 }
              }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="w-full h-full bg-black/40 backdrop-blur-xl border border-nexus-cyan/20 rounded-3xl shadow-[0_0_50px_rgba(0,242,255,0.1)] flex flex-col overflow-hidden">
                {/* Login Header */}
                <div className="h-32 bg-gradient-to-b from-nexus-cyan/10 to-transparent flex flex-col items-center justify-center border-b border-white/5 relative">
                  <div className="w-12 h-12 bg-nexus-cyan rounded-xl flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(0,242,255,0.5)]">
                    <Bird className="text-black" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-widest">{t.auth.loginTitle}</h2>
                </div>

                {/* Login Form */}
                <div className="p-8 flex-1 flex flex-col justify-center">
                  <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs text-nexus-cyan font-mono uppercase tracking-widest">{t.auth.emailPlaceholder}</label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-nexus-cyan/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10" size={18} />
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="relative z-10 w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-nexus-cyan focus:outline-none transition-all"
                          placeholder="user@nexus.io"
                        />
                      </div>
                      {errors.email && <p className="text-nexus-magenta text-[10px] ml-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-nexus-cyan font-mono uppercase tracking-widest">{t.auth.passwordPlaceholder}</label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-nexus-cyan/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10" size={18} />
                        <input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="relative z-10 w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-nexus-cyan focus:outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.password && <p className="text-nexus-magenta text-[10px] ml-1">{errors.password}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-4 bg-white text-black font-bold py-4 rounded-xl hover:bg-nexus-cyan hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          {t.auth.submitLogin} <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Switch to Register */}
                <div className="p-6 text-center border-t border-white/5 bg-white/5">
                  <p className="text-gray-500 text-xs mb-2">{t.nav.join}?</p>
                  <button
                    onClick={() => switchMode('register')}
                    className="text-nexus-cyan text-sm font-bold hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    {t.auth.registerTitle} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.4 },
                rotateY: { duration: 0.4 }
              }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Register form styling preserved from previous step */}
              <div className="w-full h-full bg-black/40 backdrop-blur-xl border border-nexus-magenta/20 rounded-3xl shadow-[0_0_50px_rgba(255,0,122,0.1)] flex flex-col overflow-hidden">
                <div className="h-32 bg-gradient-to-b from-nexus-magenta/10 to-transparent flex flex-col items-center justify-center border-b border-white/5 relative">
                  <div className="w-12 h-12 bg-nexus-magenta rounded-xl flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(255,0,122,0.5)]">
                    <Briefcase className="text-white" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-widest">{t.auth.registerTitle}</h2>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-center">
                  <form onSubmit={(e) => handleAuth(e, 'register')} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 mb-2 p-1 bg-black/40 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => setRole('freelancer')}
                        className={`py-2 text-xs font-bold rounded-md transition-all ${role === 'freelancer' ? 'bg-nexus-cyan text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                      >
                        {t.auth.freelancerRole}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('employer')}
                        className={`py-2 text-xs font-bold rounded-md transition-all ${role === 'employer' ? 'bg-nexus-magenta text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                      >
                        {t.auth.employerRole}
                      </button>
                    </div>

                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-nexus-magenta focus:outline-none transition-all"
                        placeholder={t.auth.namePlaceholder}
                      />
                    </div>

                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-nexus-magenta focus:outline-none transition-all"
                        placeholder={t.auth.emailPlaceholder}
                      />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-nexus-magenta focus:outline-none transition-all"
                        placeholder={t.auth.passwordPlaceholder}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 bg-gradient-to-r from-nexus-magenta to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-[0_0_30px_rgba(255,0,122,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : t.auth.submitRegister}
                    </button>
                  </form>
                </div>

                <div className="p-6 text-center border-t border-white/5 bg-white/5">
                  <p className="text-gray-500 text-xs mb-2">{t.common.active}?</p>
                  <button
                    onClick={() => switchMode('login')}
                    className="text-nexus-magenta text-sm font-bold hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft size={14} /> {t.auth.loginTab}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
