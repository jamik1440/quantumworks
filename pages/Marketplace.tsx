
import React, { useState, useMemo } from 'react';
import ProjectCard from '../components/ProjectCard';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ArrowUpDown, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type SortOption = 'newest' | 'oldest' | 'budget_high' | 'budget_low';

const Marketplace: React.FC = () => {
  const { projects } = useMarketplace();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to parse budget string (e.g. "$3,000 - $5,000" -> 3000)
  const getBudgetAmount = (budgetStr: string) => {
    if (!budgetStr) return 0;
    // Remove symbols and take the first number found
    const match = budgetStr.replace(/,/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Helper to parse relative time to minutes for sorting
  const getTimeWeight = (timeStr: string) => {
    if (timeStr === 'Just now') return 0;
    const num = parseInt(timeStr.replace(/\D/g, '')) || 0;
    if (timeStr.includes('m')) return num; // minutes
    if (timeStr.includes('h')) return num * 60; // hours
    if (timeStr.includes('d')) return num * 60 * 24; // days
    return 999999; // fallback
  };
  
  // Filter and Sort Logic
  const filteredAndSortedProjects = useMemo(() => {
    // 1. Base Filter (Active status)
    let result = projects.filter(p => p.status === 'active');
    
    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 3. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.skills.some(skill => skill.toLowerCase().includes(q))
      );
    }

    // 4. Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return getTimeWeight(a.postedAt) - getTimeWeight(b.postedAt);
        case 'oldest':
          return getTimeWeight(b.postedAt) - getTimeWeight(a.postedAt);
        case 'budget_high':
          return getBudgetAmount(b.budget) - getBudgetAmount(a.budget);
        case 'budget_low':
          return getBudgetAmount(a.budget) - getBudgetAmount(b.budget);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, selectedCategory, sortOption, searchQuery]);

  const categories = ['All', 'Development', 'Design', 'AI', 'Marketing'];

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
      <div className="mb-12 mt-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-8 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                {t.marketplace.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-cyan to-nexus-magenta">Missions</span>
              </h2>
              <p className="text-gray-400">{t.marketplace.subtitle}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-nexus-cyan transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder={t.common.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 hover:border-nexus-cyan/50 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-nexus-cyan transition-all w-full sm:w-[240px]"
                />
              </div>

              {/* Sort Control */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nexus-cyan">
                  <ArrowUpDown size={16} />
                </div>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="appearance-none bg-white/5 border border-white/10 hover:border-nexus-cyan/50 text-white rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-1 focus:ring-nexus-cyan transition-all cursor-pointer w-full sm:w-[200px]"
                >
                  <option value="newest" className="bg-black text-gray-300">Newest First</option>
                  <option value="oldest" className="bg-black text-gray-300">Oldest First</option>
                  <option value="budget_high" className="bg-black text-gray-300">Highest Budget</option>
                  <option value="budget_low" className="bg-black text-gray-300">Lowest Budget</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 items-center">
           <div className="text-gray-500 mr-2 flex items-center gap-2">
             <Filter size={16} />
             <span className="text-xs uppercase tracking-widest font-bold">{t.common.filterBy}</span>
           </div>
           {categories.map((filter) => (
             <button 
               key={filter} 
               onClick={() => setSelectedCategory(filter)}
               className={`px-5 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${
                 selectedCategory === filter 
                   ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' 
                   : 'bg-transparent border-white/10 text-gray-400 hover:border-nexus-cyan hover:text-white hover:bg-white/5'
               }`}
             >
               {filter}
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode='popLayout'>
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredAndSortedProjects.length > 0 ? (
            filteredAndSortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter size={32} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.marketplace.noMissions}</h3>
              <p className="text-gray-500">Try adjusting your filters or search query.</p>
              <button 
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="mt-6 px-6 py-2 bg-nexus-cyan/10 text-nexus-cyan border border-nexus-cyan/30 rounded-lg hover:bg-nexus-cyan hover:text-black transition-all"
              >
                {t.marketplace.clearFilters}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
