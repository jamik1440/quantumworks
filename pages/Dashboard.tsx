
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, FileText, DollarSign, Search, PlusCircle, Users, BarChart3, Settings, MessageSquare, X } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg bg-${color}/10 text-${color}`}>
        <Icon size={20} className={color === 'nexus-cyan' ? 'text-nexus-cyan' : 'text-nexus-magenta'} />
      </div>
    </div>
  </motion.div>
);

const ActionCard = ({ title, desc, icon: Icon, onClick }: any) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
    className="flex items-center gap-4 w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left transition-all"
  >
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nexus-cyan/20 to-nexus-magenta/20 flex items-center justify-center text-white">
      <Icon size={24} />
    </div>
    <div>
      <h4 className="font-bold text-white">{title}</h4>
      <p className="text-xs text-gray-400">{desc}</p>
    </div>
  </motion.button>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showChat, setShowChat] = useState(false);

  console.log("Dashboard Render. User:", user);

  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-4 flex items-center justify-center text-gray-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-nexus-cyan border-t-transparent animate-spin" />
          <p>Loading Dashboard Profile...</p>
        </div>
      </div>
    );
  }

  const isFreelancer = user.role === 'freelancer';

  return (
    <div className="pt-28 px-4 max-w-7xl mx-auto pb-20 min-h-screen relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-10 flex justify-between items-end"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t.dashboard.welcome}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-cyan to-nexus-magenta">{user.name}</span>
          </h1>
          <p className="text-gray-400">{t.dashboard.subtitle}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-gray-500">{t.dashboard.accountStatus}</p>
          <div className="flex items-center gap-2 text-nexus-cyan font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-nexus-cyan animate-pulse" />
            {t.common.active}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {isFreelancer ? (
          <>
            <StatCard label={t.dashboard.activeBids} value="0" icon={FileText} color="nexus-cyan" />
            <StatCard label={t.dashboard.profileViews} value="0" icon={Users} color="nexus-magenta" />
            <StatCard label={t.dashboard.earnings} value="$0" icon={DollarSign} color="nexus-cyan" />
            <StatCard label={t.dashboard.successRate} value="0%" icon={BarChart3} color="nexus-magenta" />
          </>
        ) : (
          <>
            <StatCard label={t.dashboard.activeJobs} value="0" icon={Briefcase} color="nexus-cyan" />
            <StatCard label={t.dashboard.totalSpent} value="$0" icon={DollarSign} color="nexus-magenta" />
            <StatCard label={t.dashboard.candidates} value="0" icon={Users} color="nexus-cyan" />
            <StatCard label={t.dashboard.avgHourly} value="$0/hr" icon={BarChart3} color="nexus-magenta" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {isFreelancer ? t.dashboard.recommended : t.dashboard.yourPostings}
            </h2>
            <button type="button" className="text-nexus-cyan text-sm font-bold hover:text-white transition-colors">{t.common.viewAll}</button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white group-hover:text-nexus-cyan transition-colors">
                    {isFreelancer ? 'Senior React Native Developer for FinTech' : 'Looking for 3D Artist (Blender/Maya)'}
                  </h3>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  We are looking for an experienced developer to help us build the next generation of financial tools. Must have experience with Web3.
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-black/50 rounded text-xs text-gray-300 border border-white/10">Remote</span>
                  <span className="px-2 py-1 bg-black/50 rounded text-xs text-gray-300 border border-white/10">Fixed Price</span>
                  <span className="px-2 py-1 bg-nexus-cyan/10 rounded text-xs text-nexus-cyan border border-nexus-cyan/20 font-bold">$5k - $10k</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">{t.dashboard.quickActions}</h3>
            <div className="space-y-3">
              <ActionCard
                title={t.dashboard.messages}
                desc={t.chat.title}
                icon={MessageSquare}
                onClick={() => setShowChat(true)}
              />
              {isFreelancer ? (
                <>
                  <ActionCard title={t.dashboard.findWork} desc={t.marketplace.subtitle} icon={Search} />
                  <ActionCard title={t.dashboard.updatePortfolio} desc={t.profile.portfolio} icon={FileText} />
                </>
              ) : (
                <>
                  <ActionCard title={t.dashboard.postJob} desc={t.postProject.title} icon={PlusCircle} />
                  <ActionCard title={t.dashboard.searchTalent} desc={t.nav.hireTalent} icon={Search} />
                </>
              )}
              <ActionCard title={t.dashboard.settings} desc="Preferences" icon={Settings} />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed inset-4 md:inset-10 z-50 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/80 backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => setShowChat(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:text-nexus-cyan hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
            <ChatInterface />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
