
import React, { useState } from 'react';
import { Project } from '../types';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Sparkles, Loader2, X } from 'lucide-react';
import { generateProposal } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  project: Project;
}

const ProjectCard: React.FC<Props> = ({ project }) => {
  const { t } = useLanguage();
  const [showAiModal, setShowAiModal] = useState(false);
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateProposal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAiModal(true);
    setLoading(true);
    // Mock user skills
    const skills = ['React', 'TypeScript', 'Three.js', 'Tailwind'];
    const result = await generateProposal(project.title, project.description, skills);
    setProposal(result);
    setLoading(false);
  };

  return (
    <>
    <motion.div 
      {...({
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        whileHover: { scale: 1.02, boxShadow: '0 0 30px rgba(0, 242, 255, 0.1)' },
        className: "group relative backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-nexus-cyan/50 cursor-pointer"
      } as any)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-magenta/20 rounded-full blur-[50px] -mr-16 -mt-16 transition-all group-hover:bg-nexus-cyan/20" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-nexus-cyan bg-nexus-cyan/10 rounded-full border border-nexus-cyan/20">
            {project.category}
          </span>
          <div className="flex items-center text-gray-400 text-xs gap-1">
             <Clock size={12} />
             {project.postedAt}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-nexus-cyan transition-colors line-clamp-1">{project.title}</h3>
        <p className="text-gray-400 text-sm mb-6 line-clamp-2">{project.description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.skills.slice(0, 3).map(skill => (
            <span key={skill} className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded border border-white/5">
              {skill}
            </span>
          ))}
          {project.skills.length > 3 && <span className="text-xs text-gray-500 py-1">+ {project.skills.length - 3}</span>}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center text-white font-bold gap-1">
            <DollarSign size={16} className="text-nexus-magenta" />
            {project.budget}
          </div>
          
          <button 
            onClick={handleGenerateProposal}
            className="flex items-center gap-2 text-xs font-bold text-nexus-cyan hover:text-white transition-colors group/btn"
          >
            <Sparkles size={14} className="group-hover/btn:animate-pulse" />
            {t.marketplace.aiDraft}
          </button>
        </div>
      </div>
    </motion.div>

    {/* Simple AI Modal Inline for Demo */}
    {showAiModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#0a0a0a] border border-nexus-cyan/30 rounded-2xl w-full max-w-lg p-6 relative shadow-[0_0_50px_rgba(0,242,255,0.1)]">
          <button 
            onClick={() => setShowAiModal(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="text-nexus-cyan" /> {t.marketplace.aiProposal}
          </h3>
          <p className="text-xs text-gray-500 mb-6">Powered by Gemini 2.5 Flash</p>
          
          <div className="bg-white/5 rounded-xl p-4 min-h-[150px] border border-white/10 text-sm text-gray-300 leading-relaxed font-mono">
             {loading ? (
               <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                 <Loader2 className="animate-spin text-nexus-magenta" size={32} />
                 <span className="text-nexus-magenta/80 animate-pulse">{t.marketplace.analyzing}</span>
               </div>
             ) : (
               proposal
             )}
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button 
              onClick={() => setShowAiModal(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t.common.cancel}
            </button>
            <button 
              disabled={loading}
              className="px-6 py-2 rounded-lg text-sm font-bold bg-nexus-cyan text-black hover:bg-white transition-colors disabled:opacity-50"
            >
              {t.marketplace.copyApply}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ProjectCard;
