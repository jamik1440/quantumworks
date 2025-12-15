import React from 'react';
import ThreeScene from './ThreeScene';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
         <video 
           autoPlay 
           loop 
           muted 
           playsInline
           className="w-full h-full object-cover opacity-30 scale-105 filter grayscale contrast-125"
         >
           <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
         </video>
         {/* Gradient Overlay for Fade Effect */}
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      </div>

      {/* 3D Scene Layer */}
      <ThreeScene />

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <motion.div
          {...({
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.8, ease: "easeOut" }
          } as any)}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-nexus-cyan/30 bg-nexus-cyan/5 backdrop-blur-md mb-8">
            <Zap size={14} className="text-nexus-cyan" />
            <span className="text-nexus-cyan text-xs font-bold tracking-widest uppercase">{t.hero.future}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-none uppercase drop-shadow-2xl">
             {t.hero.title}
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-8">
             <div className="h-[1px] w-12 bg-nexus-cyan/50 hidden md:block"></div>
             <p className="text-white text-lg md:text-2xl font-mono tracking-wider uppercase text-nexus-magenta font-bold">
               Precision Talent. Quantum Speed.
             </p>
             <div className="h-[1px] w-12 bg-nexus-cyan/50 hidden md:block"></div>
          </div>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            {t.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,242,255,0.4)]">
               <div className="absolute inset-0 bg-gradient-to-r from-nexus-cyan to-nexus-magenta opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
               <div className="relative flex items-center gap-2">
                 {t.hero.cta1}
                 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </div>
            </button>
            
            <button className="px-8 py-4 backdrop-blur-md bg-white/5 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Play size={12} fill="currentColor" />
              </div>
              {t.hero.cta2}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        {...({
          animate: { y: [0, 10, 0] },
          transition: { repeat: Infinity, duration: 2 },
          className: "absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
        } as any)}
      >
        <span className="text-[10px] uppercase tracking-widest text-white">{t.hero.scroll}</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-nexus-cyan to-transparent"></div>
      </motion.div>
    </div>
  );
};

export default Hero;