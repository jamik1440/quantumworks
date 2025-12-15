
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { enhanceJobDescription } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { Sparkles, Loader2, Save, FileText, DollarSign, Tag } from 'lucide-react';
import { Project } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const PostProject: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { addProject } = useMarketplace();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        skills: '',
        category: 'Development' as Project['category']
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAiEnhance = async () => {
        if (!formData.description || !formData.title) {
            showToast("Please enter a title and description first.", "error");
            return;
        }
        setAiLoading(true);
        const enhanced = await enhanceJobDescription(formData.title, formData.description, formData.budget);
        setFormData({ ...formData, description: enhanced });
        setAiLoading(false);
        showToast("Description enhanced by Gemini AI.", "success");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create valid Project object for Typescript satisfaction, 
            // though Context will transform it for API payload
            const projectPayload: any = {
                title: formData.title,
                description: formData.description,
                budget: formData.budget,
                skills: formData.skills.split(',').map(s => s.trim()),
                category: formData.category,
            };

            await addProject(projectPayload);

            showToast(t.postProject.publish + " - " + t.common.success, "success");
            navigate('/dashboard');
        } catch (error) {
            showToast("Failed to post project. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'employer' && user?.role !== 'admin') {
        return (
            <div className="pt-32 text-center text-gray-500">
                Access Restricted. Only Employers can post projects.
            </div>
        );
    }

    return (
        <div className="pt-28 px-4 max-w-3xl mx-auto pb-20 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8"
            >
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h1 className="text-3xl font-bold text-white">{t.postProject.title}</h1>
                    <div className="flex items-center gap-2 text-nexus-cyan text-sm border border-nexus-cyan/30 px-3 py-1 rounded-full bg-nexus-cyan/5">
                        <Sparkles size={14} /> {t.postProject.aiEnhanced}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2"><FileText size={16} /> {t.postProject.projectTitle}</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder={t.postProject.placeholderTitle}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-gray-400">{t.postProject.description}</label>
                            <button
                                type="button"
                                onClick={handleAiEnhance}
                                disabled={aiLoading}
                                className="text-xs font-bold text-nexus-magenta hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                {aiLoading ? t.postProject.enhancing : t.postProject.enhance}
                            </button>
                        </div>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={8}
                            placeholder={t.postProject.placeholderDesc}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none resize-none leading-relaxed"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2"><DollarSign size={16} /> {t.postProject.budget}</label>
                            <input
                                name="budget"
                                value={formData.budget}
                                onChange={handleInputChange}
                                placeholder={t.postProject.placeholderBudget}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2"><Tag size={16} /> {t.postProject.skills}</label>
                            <input
                                name="skills"
                                value={formData.skills}
                                onChange={handleInputChange}
                                placeholder={t.postProject.placeholderSkills}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none"
                                required
                            />
                            <p className="text-xs text-gray-500 italic">Separate multiple skills with commas</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">{t.postProject.category}</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-nexus-cyan outline-none"
                        >
                            <option value="Development">Development</option>
                            <option value="Design">Design</option>
                            <option value="Marketing">Marketing</option>
                            <option value="AI">AI & Machine Learning</option>
                        </select>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || aiLoading}
                            className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-nexus-cyan hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> {t.postProject.publish}</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default PostProject;
