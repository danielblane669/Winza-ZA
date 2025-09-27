import React from 'react';
import Logo from './Logo';

interface HeroProps {
  onStartWinning: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStartWinning }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" className="animate-pulse" />
        </div>
        
        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6">
          <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
            Winza ZA
          </span>
        </h1>
        
        {/* Tagline */}
        <p className="text-xl sm:text-2xl md:text-3xl text-emerald-100 mb-8 font-medium">
          Unlock Your Luck. Win Big.
        </p>
        
        {/* Description */}
        <p className="text-lg sm:text-xl text-emerald-200 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join South Africa's premier gift and money winning platform. 
          Experience the thrill of winning with complete fairness and transparency.
        </p>
        
        {/* CTA Button */}
        <button
          onClick={onStartWinning}
          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-emerald-900 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 hover:from-yellow-300 hover:to-amber-300"
        >
          <span className="relative z-10">Start Winning Now</span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
        </button>
        
        {/* Floating elements */}
        <div className="absolute top-1/4 left-8 animate-bounce delay-100">
          <div className="w-4 h-4 bg-yellow-400 rounded-full opacity-60"></div>
        </div>
        <div className="absolute top-1/3 right-12 animate-bounce delay-300">
          <div className="w-6 h-6 bg-blue-400 rounded-full opacity-40"></div>
        </div>
        <div className="absolute bottom-1/4 left-16 animate-bounce delay-500">
          <div className="w-3 h-3 bg-green-400 rounded-full opacity-70"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;