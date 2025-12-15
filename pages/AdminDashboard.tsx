
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { fetchAnalyticsData } from '../services/analyticsService';
import { AnalyticsData, TimeRange } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, CheckCircle, XCircle, AlertTriangle, Trash2, TrendingUp, DollarSign, Briefcase, Users, BarChart3, Loader2 } from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { users, projects, updateProjectStatus, deleteUser, banUser } = useMarketplace();
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'disputes' | 'analytics'>('analytics');
  
  // Analytics State
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [timeRange, activeTab]);

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await fetchAnalyticsData(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  if (user?.role !== 'admin') {
      return <div className="pt-32 text-center text-red-500 font-bold text-xl">ACCESS DENIED. ADMIN CLEARANCE REQUIRED.</div>;
  }

  const pendingProjects = projects.filter(p => p.status === 'pending');
  const activeProjects = projects.filter(p => p.status === 'active');
  const COLORS = ['#00F2FF', '#FF007A', '#FFFFFF', '#666666'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/20 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-gray-300 text-xs mb-1 font-mono uppercase">{label}</p>
          {payload.map((p: any, idx: number) => (
             <div key={idx} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}} />
                <p style={{color: p.color}} className="font-bold text-sm">
                  {p.name}: {p.value.toLocaleString()}
                  {p.dataKey === 'amount' && ' USD'}
                </p>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pt-28 px-4 max-w-7xl mx-auto pb-20 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3">
  
               <Shield className="text-nexus-magenta" /> {t.admin.title}
           </h1>
           <p className="text-gray-400 text-sm mt-1">{t.admin.subtitle}</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            {(['analytics', 'projects', 'users', 'disputes'] as const).map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-nexus-cyan text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
                >
                    {t.admin.tabs[tab]}
                    {tab === 'projects' && pendingProjects.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{pendingProjects.length}</span>}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[500px] relative">
         
         {/* ANALYTICS TAB */}
         {activeTab === 'analytics' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Analytics Header Controls */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 size={20} className="text-nexus-cyan" /> {t.admin.tabs.analytics}
                </h2>
                <div className="flex gap-2">
                  {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all uppercase tracking-wider
                        ${timeRange === range 
                          ? 'bg-nexus-magenta/20 border-nexus-magenta text-nexus-magenta' 
                          : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'}
                      `}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingAnalytics || !analyticsData ? (
                 <div className="h-[400px] flex flex-col items-center justify-center text-gray-500">
                    <Loader2 size={40} className="animate-spin text-nexus-cyan mb-4" />
                    <p>{t.common.loading}</p>
                 </div>
              ) : (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={40} /></div>
                       <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">{t.admin.revenue}</p>
                       <h3 className="text-3xl font-black text-white">${analyticsData.summary.totalRevenue.toLocaleString()}</h3>
                       <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-green-500 flex items-center font-bold bg-green-500/10 px-1.5 py-0.5 rounded">
                            <TrendingUp size={10} className="mr-1" /> {analyticsData.summary.revenueGrowth}%
                          </span>
                       </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-5 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={40} /></div>
                       <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">{t.admin.totalUsers}</p>
                       <h3 className="text-3xl font-black text-white">{analyticsData.summary.totalUsers.toLocaleString()}</h3>
                       <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-nexus-cyan flex items-center font-bold bg-nexus-cyan/10 px-1.5 py-0.5 rounded">
                            <TrendingUp size={10} className="mr-1" /> {analyticsData.summary.userGrowth}%
                          </span>
                       </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-5 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Briefcase size={40} /></div>
                       <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">{t.admin.projectsPosted}</p>
                       <h3 className="text-3xl font-black text-white">{analyticsData.summary.totalProjects.toLocaleString()}</h3>
                       <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-nexus-magenta flex items-center font-bold bg-nexus-magenta/10 px-1.5 py-0.5 rounded">
                            <TrendingUp size={10} className="mr-1" /> {analyticsData.summary.projectGrowth}%
                          </span>
                       </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-5 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle size={40} /></div>
                       <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">{t.admin.totalBids}</p>
                       <h3 className="text-3xl font-black text-white">{analyticsData.summary.totalBids.toLocaleString()}</h3>
                       <div className="mt-2 text-xs text-gray-500">
                          Avg. 4.2 bids per project
                       </div>
                    </div>
                  </div>

                  {/* Charts Row 1: Growth & Revenue */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* User Acquisition (Stacked Bar) */}
                     <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="font-bold text-white flex items-center gap-2"><Users size={16} className="text-nexus-cyan"/> {t.admin.userAcquisition}</h3>
                        </div>
                        <div className="h-[300px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analyticsData.userGrowth} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                 <XAxis dataKey="date" stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                 <YAxis stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                 <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                 <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                                 <Bar dataKey="freelancers" name="Freelancers" stackId="a" fill="#00F2FF" radius={[0, 0, 4, 4]} barSize={20} />
                                 <Bar dataKey="employers" name="Employers" stackId="a" fill="#FF007A" radius={[4, 4, 0, 0]} barSize={20} />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Revenue Trend (Area) */}
                     <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="font-bold text-white flex items-center gap-2"><DollarSign size={16} className="text-green-400"/> {t.admin.revenueTrend}</h3>
                        </div>
                        <div className="h-[300px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analyticsData.revenue} margin={{top: 10, right: 10, left: -10, bottom: 0}}>
                                 <defs>
                                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                   </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                 <XAxis dataKey="date" stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                 <YAxis stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                 <Tooltip content={<CustomTooltip />} />
                                 <Area type="monotone" dataKey="amount" name="Revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </div>

                  {/* Charts Row 2: Projects & Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     
                     {/* User Roles Pie */}
                     <div className="bg-black/40 border border-white/10 rounded-xl p-6 lg:col-span-1">
                        <h3 className="font-bold text-white mb-4">{t.admin.userComposition}</h3>
                        <div className="h-[200px] w-full relative">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                   data={analyticsData.roleDistribution}
                                   cx="50%"
                                   cy="50%"
                                   innerRadius={60}
                                   outerRadius={80}
                                   paddingAngle={5}
                                   dataKey="value"
                                   stroke="none"
                                 >
                                   {analyticsData.roleDistribution.map((_, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                   ))}
                                 </Pie>
                                 <Tooltip content={<CustomTooltip />} />
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-2xl font-bold text-white">{analyticsData.summary.totalUsers.toLocaleString()}</span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Total</span>
                           </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            {analyticsData.roleDistribution.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index]}} />
                                    <span className="text-gray-400">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                     </div>

                     {/* Projects Velocity (Line) */}
                     <div className="bg-black/40 border border-white/10 rounded-xl p-6 lg:col-span-2">
                        <h3 className="font-bold text-white mb-6">{t.admin.projectVelocity}</h3>
                        <div className="h-[230px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={analyticsData.projectStats} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                 <XAxis dataKey="date" stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                 <YAxis stroke="#666" tick={{fill: '#888', fontSize: 10}} tickLine={false} axisLine={false} />
                                 <Tooltip content={<CustomTooltip />} />
                                 <Legend wrapperStyle={{fontSize: '12px'}} />
                                 <Line type="monotone" dataKey="posted" name="Posted" stroke="#FF007A" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                                 <Line type="monotone" dataKey="completed" name="Completed" stroke="#00F2FF" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                  </div>
                </>
              )}
           </div>
         )}

         {/* PROJECTS TAB */}
         {activeTab === 'projects' && (
             <div className="space-y-6">
                 <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">{t.admin.pending}</h2>
                 {pendingProjects.length === 0 ? (
                     <div className="text-gray-500 text-sm italic py-4">{t.common.noData}</div>
                 ) : (
                     pendingProjects.map(project => (
                         <div key={project.id} className="bg-black/40 border border-yellow-500/30 rounded-xl p-4 flex justify-between items-center">
                             <div>
                                 <h3 className="font-bold text-white">{project.title}</h3>
                                 <p className="text-gray-400 text-sm line-clamp-1">{project.description}</p>
                                 <div className="flex gap-2 mt-2 text-xs">
                                     <span className="text-nexus-cyan">{project.authorName}</span>
                                     <span className="text-gray-500">{project.budget}</span>
                                 </div>
                             </div>
                             <div className="flex gap-2">
                                 <button 
                                     onClick={() => updateProjectStatus(project.id, 'active')}
                                     className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/40"
                                     title="Approve"
                                 >
                                     <CheckCircle size={20} />
                                 </button>
                                 <button 
                                     onClick={() => updateProjectStatus(project.id, 'rejected')}
                                     className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40"
                                     title="Reject"
                                 >
                                     <XCircle size={20} />
                                 </button>
                             </div>
                         </div>
                     ))
                 )}

                 <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mt-8">{t.admin.active}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {activeProjects.map(project => (
                         <div key={project.id} className="bg-white/5 border border-white/5 rounded-xl p-4">
                              <h3 className="font-bold text-gray-200 text-sm">{project.title}</h3>
                              <div className="flex justify-between mt-2 text-xs text-gray-500">
                                  <span>{project.authorName}</span>
                                  <span className="text-green-500">{t.common.active}</span>
                              </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}

         {/* USERS TAB */}
         {activeTab === 'users' && (
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead>
                         <tr className="text-gray-500 text-sm border-b border-white/10">
                             <th className="p-3">{t.admin.userList.user}</th>
                             <th className="p-3">{t.admin.userList.role}</th>
                             <th className="p-3">{t.admin.userList.status}</th>
                             <th className="p-3 text-right">{t.admin.userList.actions}</th>
                         </tr>
                     </thead>
                     <tbody>
                         {users.map(u => (
                             <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-3">
                                     <div className="font-bold text-white">{u.name}</div>
                                     <div className="text-xs text-gray-500">{u.email}</div>
                                 </td>
                                 <td className="p-3">
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-red-500/20 text-red-500' : u.role === 'employer' ? 'bg-nexus-magenta/20 text-nexus-magenta' : 'bg-nexus-cyan/20 text-nexus-cyan'}`}>
                                         {u.role.toUpperCase()}
                                     </span>
                                 </td>
                                 <td className="p-3">
                                     {u.banned ? <span className="text-red-500 text-xs font-bold">BANNED</span> : <span className="text-green-500 text-xs">{t.common.active}</span>}
                                 </td>
                                 <td className="p-3 text-right flex justify-end gap-2">
                                     {u.role !== 'admin' && (
                                         <>
                                            <button 
                                                onClick={() => banUser(u.id)}
                                                className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg" 
                                                title={t.common.delete}
                                            >
                                                <AlertTriangle size={16} />
                                            </button>
                                            <button 
                                                onClick={() => deleteUser(u.id)}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                                title={t.common.delete}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                         </>
                                     )}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}

         {/* DISPUTES TAB */}
         {activeTab === 'disputes' && (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                 <Shield size={48} className="mb-4 opacity-50" />
                 <p>{t.common.noData}</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default AdminDashboard;
