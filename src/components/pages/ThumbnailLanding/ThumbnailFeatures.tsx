import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  Palette, 
  TrendingUp, 
  Shield, 
  Clock,
  Star,
  Users,
  CheckCircle
} from 'lucide-react';

const ThumbnailFeatures: React.FC = () => {
  const mainFeatures = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Understands Your Vision",
      description: "Describe your video in plain words. Our technology translates your ideas into visuals that capture exactly what you meant.",
      benefits: ["Reads between the lines", "Captures your style", "Gets your message"]
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Gratification",
      description: "No more waiting. No more revisions. Your perfect thumbnail appears in moments, ready to captivate your audience.",
      benefits: ["Ready in seconds", "No waiting", "Immediate results"]
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Built to Perform",
      description: "Every thumbnail is crafted using principles that make people click. Your content gets the attention it deserves.",
      benefits: ["Attention-grabbing", "Scroll-stopping", "Click-worthy"]
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Options That Matter",
      description: "Get multiple variations instantly. Choose the one that feels right, or test different approaches to find your winner.",
      benefits: ["Multiple options", "High resolution", "Perfect for any platform"]
    }
  ];

  const comparisonFeatures = [
    {
      title: "Old Way",
      points: [
        { feature: "Time investment", value: "Hours of work", negative: true },
        { feature: "Skills required", value: "Design expertise", negative: true },
        { feature: "Cost per thumbnail", value: "$50-200", negative: true },
        { feature: "Consistency", value: "Hit or miss", negative: true },
        { feature: "Revisions", value: "Costly & slow", negative: true }
      ]
    },
    {
      title: "New Way",
      points: [
        { feature: "Time investment", value: "Seconds", negative: false },
        { feature: "Skills required", value: "None", negative: false },
        { feature: "Cost per thumbnail", value: "Free", negative: false },
        { feature: "Consistency", value: "Every time", negative: false },
        { feature: "Revisions", value: "Instant", negative: false }
      ]
    }
  ];

  const stats = [
    { value: "Creators", label: "Trust Our Platform", icon: <Users className="w-5 h-5" /> },
    { value: "Better", label: "Than Design Tools", icon: <Star className="w-5 h-5" /> },
    { value: "More", label: "Engaging Content", icon: <TrendingUp className="w-5 h-5" /> },
    { value: "Seconds", label: "To Perfect Thumbnail", icon: <Clock className="w-5 h-5" /> }
  ];

  return (
    <div className="py-20 bg-gradient-to-br from-[#09090B] via-[#111114] to-[#09090B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-full border border-[#fa7517]/30 mb-6">
            <Shield className="w-4 h-4 text-[#fa7517]" />
            <span className="text-sm font-medium text-white">The Future of Content Creation</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop Settling for
            <br />
            <span className="bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent">
              Mediocre Thumbnails
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your content deserves thumbnails that match its quality. 
            Create images that make viewers choose you over everyone else.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="relative bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-[#fa7517]/30 transition-all duration-300">
                  <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white mb-2">
                    <div className="text-[#fa7517]">
                      {stat.icon}
                    </div>
                    <span>{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              <div className="relative bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 h-full hover:border-[#fa7517]/30 transition-all duration-300">
                <div className="text-[#fa7517] mb-4">
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-400">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              The Old Way vs The New Way
            </h3>
            <p className="text-gray-400 text-lg">
              Why creators are making the switch
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {comparisonFeatures.map((column, columnIndex) => (
              <motion.div
                key={columnIndex}
                initial={{ opacity: 0, x: columnIndex === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: columnIndex * 0.2 }}
                className="relative group"
              >
                <div className={`absolute -inset-0.5 rounded-2xl blur transition-all duration-500 ${
                  columnIndex === 1 
                    ? 'bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 opacity-0 group-hover:opacity-100' 
                    : 'bg-gradient-to-r from-gray-500/10 to-gray-600/10 opacity-0 group-hover:opacity-100'
                }`} />
                
                <div className={`relative backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 ${
                  columnIndex === 1 
                    ? 'bg-gradient-to-br from-black/80 to-black/60 border-white/10 hover:border-[#fa7517]/30' 
                    : 'bg-gradient-to-br from-gray-900/50 to-gray-900/30 border-gray-700/30 hover:border-gray-600/50'
                }`}>
                  <div className="text-center mb-6">
                    <h4 className={`text-xl font-bold mb-2 ${
                      columnIndex === 1 
                        ? 'bg-gradient-to-r from-[#fa7517] to-orange-400 bg-clip-text text-transparent' 
                        : 'text-gray-300'
                    }`}>
                      {column.title}
                    </h4>
                    {columnIndex === 1 && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-full border border-[#fa7517]/30">
                        <Star className="w-3 h-3 text-[#fa7517]" />
                        <span className="text-xs text-white font-medium">RECOMMENDED</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {column.points.map((point, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                        <span className="text-sm text-gray-400">{point.feature}</span>
                        <span className={`font-semibold ${
                          point.negative ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {point.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="relative group inline-block">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#fa7517]/20 to-orange-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-[#fa7517]/30 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-4">
                Your Content Deserves Better
              </h3>
              <p className="text-gray-300 mb-6">
                Stop letting boring thumbnails hold back your amazing content
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                <span>✓ Free to try</span>
                <span>✓ No experience required</span>
                <span>✓ Professional results</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThumbnailFeatures; 