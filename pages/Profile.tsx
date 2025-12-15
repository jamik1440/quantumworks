
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, MapPin, Building, Link as LinkIcon, Globe, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!user) return null;

  const isFreelancer = user.role === 'freelancer';

  return (
    <div className="pt-28 px-4 max-w-7xl mx-auto min-h-screen pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-nexus-cyan/20 to-nexus-magenta/20" />
             <div className="relative z-10 mt-8">
               <div className="w-32 h-32 mx-auto rounded-full p-1 bg-gradient-to-br from-nexus-cyan to-nexus-magenta">
                 {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-black" />
                 ) : (
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-4xl font-bold text-gray-700">
                      {user.name.charAt(0)}
                    </div>
                 )}
               </div>
               <h1 className="text-2xl font-bold text-white mt-4">{user.name}</h1>
               <p className="text-nexus-cyan font-medium capitalize">
                 {isFreelancer ? (user.skills?.[0] || 'Freelancer') : (user.companyName || 'Employer')}
               </p>
               
               {user.location && (
                 <div className="flex items-center justify-center gap-2 mt-2 text-gray-400 text-sm">
                   <MapPin size={14} /> {user.location}
                 </div>
               )}

               <div className="mt-6 flex justify-center gap-4">
                 <div className="text-center">
                   <div className="text-xl font-bold text-white">100%</div>
                   <div className="text-xs text-gray-500">{t.profile.success}</div>
                 </div>
                 <div className="text-center">
                   <div className="text-xl font-bold text-white">42</div>
                   <div className="text-xs text-gray-500">{t.profile.jobs}</div>
                 </div>
                 <div className="text-center">
                   <div className="text-xl font-bold text-white">4.9</div>
                   <div className="text-xs text-gray-500">{t.profile.rating}</div>
                 </div>
               </div>
               
               <button 
                 onClick={() => navigate('/profile/edit')}
                 className="w-full mt-6 py-2 rounded-lg bg-nexus-cyan text-black font-bold text-sm hover:bg-white transition-colors"
               >
                 {t.profile.editProfile}
               </button>
             </div>
          </div>
          
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2">
               <Shield size={18} className="text-nexus-magenta" /> {t.profile.verifications}
             </h3>
             <ul className="space-y-3 text-sm text-gray-300">
               <li className="flex justify-between">{t.profile.identity} <span className="text-nexus-cyan">Verified</span></li>
               <li className="flex justify-between">{t.profile.payment} <span className="text-nexus-cyan">Verified</span></li>
               <li className="flex justify-between">{t.profile.phone} <span className="text-nexus-cyan">Verified</span></li>
               <li className="flex justify-between">{t.profile.email} <span className="text-nexus-cyan">Verified</span></li>
             </ul>
          </div>

          {/* Conditional: Freelancer Portfolio */}
          {isFreelancer && user.portfolio && user.portfolio.length > 0 && (
             <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <LinkIcon size={18} className="text-nexus-cyan" /> {t.profile.portfolio}
                </h3>
                <div className="space-y-3">
                  {user.portfolio.map((link, i) => (
                    <a 
                      key={i} 
                      href={link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 hover:border-nexus-cyan/30 transition-all group"
                    >
                      <div className="p-2 rounded-full bg-nexus-cyan/10 text-nexus-cyan group-hover:bg-nexus-cyan group-hover:text-black transition-colors">
                        <Globe size={14} />
                      </div>
                      <span className="text-sm text-gray-300 truncate flex-1 group-hover:text-white transition-colors">
                        {link.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                      </span>
                      <ExternalLink size={12} className="text-gray-600 group-hover:text-nexus-cyan transition-colors" />
                    </a>
                  ))}
                </div>
             </div>
          )}

          {/* Conditional: Employer Company Details */}
          {!isFreelancer && (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
               <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                 <Building size={18} className="text-nexus-magenta" /> {t.profile.companyInfo}
               </h3>
               <div className="space-y-4">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{t.profile.organization}</p>
                      <p className="text-white font-medium">{user.companyName || 'Not specified'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{t.profile.industry}</p>
                        <p className="text-gray-300 text-sm truncate">{user.industry || 'N/A'}</p>
                     </div>
                     <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{t.profile.hq}</p>
                        <p className="text-gray-300 text-sm truncate">{user.location || 'N/A'}</p>
                     </div>
                  </div>
                  
                  <div className="pt-2 border-t border-white/5">
                     <a href="#" className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-nexus-cyan hover:text-white transition-colors">
                        <Globe size={12} /> {t.profile.visitWebsite}
                     </a>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">{t.profile.about}</h2>
            <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-line">
              {user.bio || t.profile.noBio}
            </p>
            
            {isFreelancer && user.skills && (
              <div className="flex flex-wrap gap-2">
                {user.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-nexus-cyan border border-white/5">
                    {skill}
                  </span>
                ))}
              </div>
            )}
            
            {!isFreelancer && user.industry && (
               <div className="flex gap-2 mt-4 p-3 bg-white/5 rounded-lg inline-flex items-center">
                 <Building size={16} className="text-gray-400" />
                 <span className="text-gray-300 text-sm">{t.profile.industry}:</span>
                 <span className="text-white font-medium text-sm">{user.industry}</span>
               </div>
            )}
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
               {isFreelancer ? t.profile.workHistory : t.profile.companyHistory}
            </h2>
            
            {user.jobHistory ? (
                <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                   {user.jobHistory}
                </div>
            ) : (
                <div className="space-y-6">
                  {/* Default Mock Content if empty */}
                  {[1, 2].map((item) => (
                    <div key={item} className="border-b border-white/5 last:border-0 pb-6 last:pb-0 opacity-50">
                      <div className="flex justify-between mb-2">
                        <h3 className="text-lg font-bold text-white">
                           {isFreelancer ? 'Example Project' : 'Previous Job Posting'}
                        </h3>
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 mb-3">
                        <span>Jan 2024</span>
                        <span>Fixed Price</span>
                        <span className="text-white font-bold">$5,000</span>
                      </div>
                      <p className="text-gray-400 text-sm italic">
                        "Add your real history in the Edit Profile section."
                      </p>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
