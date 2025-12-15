
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Plus, Trash2, User as UserIcon, Building, MapPin, DollarSign, Link as LinkIcon, Briefcase, X, Camera } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const EditProfile: React.FC = () => {
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Initialize state with user data or safe defaults
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    avatar: '',
    role: 'freelancer',
    bio: '',
    location: '',
    skills: [],
    hourlyRate: '',
    portfolio: [],
    companyName: '',
    industry: '',
    jobHistory: '',
  });

  // Ensure form data is synced with user context on load
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        role: user.role,
        bio: user.bio || '',
        location: user.location || '',
        skills: user.skills || [],
        hourlyRate: user.hourlyRate || '',
        portfolio: user.portfolio || [],
        companyName: user.companyName || '',
        industry: user.industry || '',
        jobHistory: user.jobHistory || '',
      });
    }
  }, [user]);

  const [newSkill, setNewSkill] = useState('');
  const [newLink, setNewLink] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newSkill.trim()) {
      const currentSkills = formData.skills || [];
      if (!currentSkills.includes(newSkill.trim())) {
         setFormData({ ...formData, skills: [...currentSkills, newSkill.trim()] });
      }
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (formData.skills) {
      setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
    }
  };

  const handleAddLink = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newLink.trim()) {
       const currentPortfolio = formData.portfolio || [];
       if (!currentPortfolio.includes(newLink.trim())) {
          setFormData({ ...formData, portfolio: [...currentPortfolio, newLink.trim()] });
       }
       setNewLink('');
    }
  };

  const removeLink = (linkToRemove: string) => {
    if (formData.portfolio) {
      setFormData({ ...formData, portfolio: formData.portfolio.filter(l => l !== linkToRemove) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
        // Construct updated user object preserving ID and other non-editable fields
        const updatedUser: User = {
            ...user,
            ...formData,
        } as User;
        
        // Update local context to reflect changes immediately
        login(updatedUser, localStorage.getItem('token') || '');
        navigate('/profile');
    }
  };

  if (!user) return null;

  return (
    <div className="pt-28 px-4 max-w-4xl mx-auto pb-20 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 relative"
      >
        <button 
          onClick={() => navigate('/profile')}
          className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={20} /> {t.common.back}
        </button>

        <h1 className="text-3xl font-bold text-white mb-8 text-center">{t.profile.editProfile}</h1>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
          
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-nexus-cyan transition-colors bg-black shadow-2xl">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-700 bg-gradient-to-br from-gray-800 to-black">
                    {formData.name?.charAt(0) || <UserIcon size={40} />}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2.5 bg-nexus-cyan text-black rounded-full cursor-pointer hover:bg-white hover:scale-110 transition-all shadow-lg z-10 border border-black/20">
                 <Camera size={18} />
                 <input 
                   type="file" 
                   accept="image/*" 
                   onChange={handleImageUpload} 
                   className="hidden" 
                 />
              </label>
            </div>
            <p className="text-gray-500 text-xs mt-3">JPG/PNG, max 2MB</p>
          </div>

          {/* Basic Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-nexus-cyan flex items-center gap-2 border-b border-white/10 pb-2">
              <UserIcon size={20} /> {t.profile.basicInfo}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">{t.profile.fullName}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none transition-all focus:shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">{t.profile.location}</label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-nexus-cyan transition-colors" size={16} />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder={t.profile.location}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-nexus-cyan outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">{t.profile.bio}</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder={t.profile.bio}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none resize-none transition-all"
              />
            </div>
          </div>

          {/* Conditional Rendering: Freelancer Specific Fields */}
          {user.role === 'freelancer' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-nexus-magenta flex items-center gap-2 border-b border-white/10 pb-2">
                <Briefcase size={20} /> {t.profile.professionalDetails}
              </h2>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">{t.profile.hourlyRate}</label>
                <div className="relative group">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-nexus-magenta transition-colors" size={16} />
                   <input
                    type="text"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    placeholder="e.g. 50-80"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-nexus-magenta outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">{t.profile.skills}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                    placeholder={t.profile.addSkill}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-magenta outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSkill}
                    className="bg-white/10 text-white p-3 rounded-xl hover:bg-nexus-magenta hover:text-black transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-black/20 rounded-xl border border-white/5">
                  {formData.skills && formData.skills.length > 0 ? formData.skills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-nexus-magenta/10 border border-nexus-magenta/30 rounded-full text-sm text-white flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-nexus-magenta transition-colors"><X size={14} /></button>
                    </span>
                  )) : (
                    <span className="text-gray-600 text-sm italic">{t.common.noData}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">{t.profile.portfolioLinks}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink(e)}
                    placeholder="https://..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-magenta outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddLink}
                    className="bg-white/10 text-white p-3 rounded-xl hover:bg-nexus-magenta hover:text-black transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.portfolio && formData.portfolio.length > 0 ? formData.portfolio.map(link => (
                    <div key={link} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5 animate-in fade-in slide-in-from-left duration-200">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <LinkIcon size={14} className="text-nexus-cyan flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{link}</span>
                      </div>
                      <button type="button" onClick={() => removeLink(link)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  )) : (
                    <div className="text-gray-600 text-sm italic p-2">{t.common.noData}</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Conditional Rendering: Employer Specific Fields */}
          {user.role === 'employer' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-nexus-cyan flex items-center gap-2 border-b border-white/10 pb-2">
                <Building size={20} /> {t.profile.companyInfo}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">{t.profile.companyName}</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">{t.profile.industry}</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g. FinTech, AI, Health"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">{t.profile.jobHistory}</label>
                <textarea
                  name="jobHistory"
                  value={formData.jobHistory}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder={t.profile.companyHistory}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none resize-none transition-all"
                />
              </div>
            </motion.div>
          )}

          <div className="pt-8 border-t border-white/10 flex justify-end">
            <button 
              type="submit"
              className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-nexus-cyan hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Save size={18} /> {t.common.save}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfile;
