import React from 'react';
import { Gift, Shield, Users, Zap } from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: Gift,
      title: "Amazing Prizes",
      description: "Win exciting gifts and cash prizes daily. From electronics to cash rewards, there's something for everyone."
    },
    {
      icon: Shield,
      title: "Fair & Transparent",
      description: "Our platform ensures complete fairness with transparent processes and verified random selections."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join thousands of South African winners in our growing community of lucky participants."
    },
    {
      icon: Zap,
      title: "Instant Wins",
      description: "Experience the thrill of instant wins with our fast and secure platform powered by cutting-edge technology."
    }
  ];

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About <span className="text-emerald-600">Winza ZA</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Winza ZA is South Africa's premier online platform where dreams come true. 
            We've created a secure, fair, and exciting environment where anyone can participate 
            and win amazing prizes and cash rewards.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-6">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-emerald-900 font-bold text-xl mx-auto">
                1
              </div>
              <h4 className="text-xl font-bold">Sign Up</h4>
              <p className="text-emerald-100">Create your free account in seconds and join our winning community.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-emerald-900 font-bold text-xl mx-auto">
                2
              </div>
              <h4 className="text-xl font-bold">Participate</h4>
              <p className="text-emerald-100">Enter our daily contests and games for a chance to win amazing prizes.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-emerald-900 font-bold text-xl mx-auto">
                3
              </div>
              <h4 className="text-xl font-bold">Win Big</h4>
              <p className="text-emerald-100">Receive your winnings instantly and enjoy your prizes!</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;