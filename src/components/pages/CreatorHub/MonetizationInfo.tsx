import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingUp, Users, Repeat, Crown, Lock, Calculator, ChevronDown, ChevronUp, Sparkles, Share2, MessageCircle, Globe, DollarSign, Award, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../common/Header';
import CreatorHubNav from './CreatorHubNav';
import { ChannelSelectionProvider } from '../../../contexts/ChannelSelectionContext';
import ContentPassAnimation from '../../animations/ContentPassAnimation';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

// FAQ Items
const faqItems = [
  {
    question: "What exactly is an NFT Content Pass?",
    answer: "An NFT Content Pass is a digital asset that grants exclusive access to premium content. Unlike a subscription, it's an asset that can be kept, traded, or sold. Think of it as an exclusive membership card that has inherent value and can appreciate over time."
  },
  {
    question: "How does the Content Pass benefit me as a creator?",
    answer: "As a creator, you receive 90% of the initial sale and continue earning from every subsequent transaction when your passes are traded. This creates a sustainable, ongoing revenue stream beyond the initial sale. It also lets you offer truly exclusive content to your most dedicated fans."
  },
  {
    question: "What kind of content can I put behind a Content Pass?",
    answer: "You can place any type of content behind a Pass - exclusive videos, tutorials, behind-the-scenes footage, early access content, special announcements, personalized content, or any digital experience you want to make exclusive and premium."
  },
  {
    question: "Do I need to upload my videos to Base.Tube?",
    answer: "No! That's one of the biggest advantages. You can keep your content on platforms like YouTube (as unlisted videos), and we simply generate access links. Your workflow stays the same - just add the links to your existing content when creating a pass."
  },
  {
    question: "How is this different from a subscription model?",
    answer: "Unlike subscriptions that require ongoing payments and expire when cancelled, Content Passes are owned assets. Your fans buy them once and own them permanently. They can keep them for continued access, or sell them to others if they choose, potentially even at a profit."
  },
  {
    question: "How do fans purchase a Content Pass?",
    answer: "Fans can purchase Content Passes directly on Base.Tube using cryptocurrency or traditional payment methods. The process is simple and designed to be accessible even to those new to NFTs or digital collectibles."
  },
  {
    question: "What happens if someone buys my pass and then wants to sell it?",
    answer: "That's the beauty of the system! If a fan wants to sell their pass, they can do so on our marketplace. You'll automatically receive a percentage of every resale, creating a continuous revenue stream. As your content becomes more valuable, the price of passes can increase, benefiting both you and your fans."
  },
  {
    question: "Is there a limit to how many passes I can create?",
    answer: "You can create multiple Content Passes for different types of content. Each pass can have its own supply cap, pricing, and exclusive content. This gives you flexibility to create tiers of exclusivity."
  },
  {
    question: "How do I determine the right price and supply for my pass?",
    answer: "Our Revenue Simulator can help you find the optimal price point and supply cap based on your audience size and engagement. Generally, more exclusive passes (lower supply) can command higher prices, but the best strategy depends on your specific audience and content."
  }
];

const MonetizationInfo: React.FC = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const navigate = useNavigate();

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleCreatePass = () => {
    if (!PASSES_ENABLED) return;
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    navigate('/creator-hub/create-content-pass');
  };

  return (
    <ChannelSelectionProvider>
      <div className="min-h-screen bg-black">
        <Header onNavToggle={() => setIsNavCollapsed(!isNavCollapsed)} />
        <div className="flex">
          <CreatorHubNav isCollapsed={isNavCollapsed} onToggle={() => setIsNavCollapsed(!isNavCollapsed)} />
          
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 pt-24 max-w-7xl mx-auto"
          >
            {/* Premium Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-black mx-4 mb-16">
              <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0f0f0f] to-black overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[#fa7517]/5"></div>
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-r from-[#fa7517]/20 to-[#fa7517]/5 blur-3xl"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-r from-[#fa7517]/10 to-[#fa7517]/5 blur-3xl"></div>
              </div>
              
              <div className="relative px-8 py-16 md:py-24 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="max-w-4xl mx-auto text-center"
                >
                  <div className="flex justify-center mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                      className="bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] p-4 rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-black rounded-full m-[3px]"></div>
                      <Crown className="relative z-10 w-8 h-8 text-[#fa7517]" />
                    </motion.div>
                  </div>
                  
                  <motion.h1 
                    className="text-5xl md:text-6xl font-bold mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400">
                       Content Pass:
                    </span>
                    <br />
                    <span className="text-white">The Future of Creator Economy</span>
                  </motion.h1>
                  
                  <motion.p 
                    className="text-xl text-gray-300 max-w-3xl mx-auto mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    Transform how you share exclusive content with your community. Create digital assets that 
                    grant access to your premium content while generating continuous revenue.
                  </motion.p>
                  
                  {/* Animation component */}
                  {showAnimation && (
                    <ContentPassAnimation onComplete={handleAnimationComplete} />
                  )}

                  {/* Hero buttons section - updated */}
                  <motion.div
                    className="flex flex-wrap gap-4 justify-center items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    <motion.button
                      onClick={handleCreatePass}
                      whileHover={PASSES_ENABLED ? { scale: 1.05, boxShadow: '0 10px 25px rgba(250, 117, 23, 0.3)' } : {}}
                      whileTap={PASSES_ENABLED ? { scale: 0.95 } : {}}
                      className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-3 shadow-lg ${PASSES_ENABLED ? 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black shadow-[#fa7517]/20' : 'bg-gray-700/50 text-white/70 cursor-not-allowed'}`}
                    >
                      <Star className="w-5 h-5" />
                      {PASSES_ENABLED ? 'Create Your First Pass' : 'Coming Soon'}
                    </motion.button>
                    <Link to="/creator-hub/nft-simulator">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-black/40 border border-gray-700 hover:border-gray-600 text-white rounded-xl font-medium flex items-center gap-3 transition-colors"
                      >
                        <Calculator className="w-5 h-5" />
                        Revenue Simulator
                      </motion.button>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            <div className="px-4 space-y-16 pb-24">
              {/* Vision Section - Updated to be creator-focused */}
              <section className="bg-black/30 rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#fa7517]/5 blur-3xl"></div>
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#fa7517]/5 blur-3xl"></div>
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Globe className="w-6 h-6 text-[#fa7517]" />
                    What is a Content Pass?
                  </h2>
                  
                  <div className="prose prose-invert prose-orange max-w-none">
                    <p className="text-lg">
                      As a creator, you're always looking for better ways to monetize your content. The Content Pass 
                      is a <strong className="text-[#fa7517]">revolutionary new revenue stream</strong> designed specifically for creators like you.
                    </p>
                    <p>
                      <span className="text-white font-medium">You earn <span className="text-[#fa7517] font-bold text-lg">90% of every sale</span> and get paid immediately.</span> No waiting for monthly payouts or reaching minimum thresholds. Create a pass today, sell it tomorrow, and the money is yours.
                    </p>
                    <p>
                      Think of it as an exclusive digital ticket that your fans purchase to access your premium content. 
                      Unlike subscriptions that expire, these passes are actual digital assets that your audience owns. 
                      They can keep, trade, or sell them — and you earn royalties from every resale transaction.
                    </p>
                    <p>
                      <strong className="text-[#fa7517] font-semibold">The best part?</strong> You don't need to move your content or change your workflow. 
                      Simply create a pass, add links to your existing videos, and we generate a special link for you 
                      to share on your social platforms. <span className="underline text-white">Your content stays where it is</span>, but now it's monetized in a whole new way.
              </p>
            </div>
                </div>
              </section>

              {/* How It Works Section - Enhanced */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  >
                    <Sparkles className="w-7 h-7 text-[#fa7517]" />
                  </motion.div>
                  How It Works
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-black/30 rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fa7517] to-transparent"></div>
                    <div className="h-12 w-12 flex items-center justify-center bg-[#fa7517]/10 rounded-lg mb-4">
                      <DollarSign className="w-6 h-6 text-[#fa7517]" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Create & Sell</h3>
                    <p className="text-gray-300">
                      Create a Content Pass and set your price and supply. Fans purchase these passes directly on Base.Tube.
                    </p>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-black/30 rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fa7517] to-transparent"></div>
                    <div className="h-12 w-12 flex items-center justify-center bg-[#fa7517]/10 rounded-lg mb-4">
                      <Lock className="w-6 h-6 text-[#fa7517]" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Exclusive Access</h3>
                    <p className="text-gray-300">
                      Your fans use their passes to unlock exclusive content. The pass serves as a key that grants them access to your premium content.
                    </p>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-black/30 rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fa7517] to-transparent"></div>
                    <div className="h-12 w-12 flex items-center justify-center bg-[#fa7517]/10 rounded-lg mb-4">
                      <Share2 className="w-6 h-6 text-[#fa7517]" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Trade & Earn</h3>
                    <p className="text-gray-300">
                      Fans can keep, trade, or sell their passes on our marketplace. You earn royalties from every subsequent sale, creating an ongoing revenue stream.
                    </p>
                  </motion.div>
                </div>
              </section>

              {/* For Creators Section - Kept and enhanced */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <Crown className="w-7 h-7 text-[#fa7517]" />
                  For Creators
                </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <BenefitCard
                  icon={Coins}
                  title="Earn More"
                  description="Receive 90% of initial pass sales and ongoing royalties from every resale in the marketplace"
                />
                <BenefitCard
                  icon={TrendingUp}
                  title="Sustainable Revenue"
                  description="The NFT Content Pass creates lasting value as your community trades them"
                />
                <BenefitCard
                  icon={Repeat}
                  title="Permanent Revenue"
                  description="Unlike subscriptions that end, each Content Pass trade generates revenue - forever"
                />
                <BenefitCard
                  icon={Users}
                  title="Community Growth"
                  description="Turn your biggest fans into stakeholders in your success"
                />
              </div>
              </section>

              {/* For Community Section - Kept and enhanced */}
              <section>
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <MessageCircle className="w-7 h-7 text-[#fa7517]" />
                  For Your Community
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BenefitCard
                  icon={Crown}
                  title="Own Their Access"
                  description="Fans own their pass - they can keep, trade, or sell it"
                />
                <BenefitCard
                  icon={TrendingUp}
                  title="Potential Returns"
                  description="As demand for your exclusive content grows, so can the value of their pass"
                />
                <BenefitCard
                  icon={Lock}
                  title="Exclusive Experience"
                  description="Access premium content unavailable anywhere else"
                />
              </div>
              </section>

              {/* Real-World Example Section - Updated to be more relatable to individual creators */}
              <section className="bg-black/30 rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-40 left-40 w-80 h-80 rounded-full bg-[#fa7517]/5 blur-3xl"></div>
                  <div className="absolute -bottom-40 right-40 w-80 h-80 rounded-full bg-[#fa7517]/5 blur-3xl"></div>
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Award className="w-6 h-6 text-[#fa7517]" />
                    Creator Success Story
                  </h2>
                  
                  <div className="prose prose-invert prose-orange max-w-none">
                    <p>
                      Imagine you're a cooking instructor with 5,000 YouTube subscribers. You create a special NFT Content Pass 
                      for $15 with a limit of 100 passes. Behind this pass, you place your advanced technique tutorials that are 
                      too valuable to give away for free.
                    </p>
                    <p>
                      Your dedicated followers purchase all 100 passes, earning you $1,500 immediately (minus our small platform fee). 
                      But that's just the beginning. As your reputation grows, some early buyers sell their passes for $25 each to new fans 
                      who missed out. You automatically receive a percentage of each of these resales.
                    </p>
                    <p>
                      Over time, as demand increases, some passes trade for $40 or more. With each trade, you earn royalties 
                      without doing any additional work. Meanwhile, your exclusive content creates a premium community that values 
                      your expertise, all while your public content continues to grow your audience on platforms like YouTube.
                    </p>
                  </div>
                </div>
              </section>

              {/* Call-to-Action Section (Enhanced) */}
              <section className="bg-gradient-to-br from-black/80 to-[#fa7517]/10 rounded-3xl p-12 border border-[#fa7517]/20 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#fa7517]/50 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#fa7517]/50 to-transparent"></div>
                  <div className="absolute -top-40 right-40 w-80 h-80 rounded-full bg-[#fa7517]/5 blur-3xl"></div>
            </div>

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                      Ready to revolutionize your content strategy?
                    </h2>
                    <p className="text-xl text-gray-300 mb-10">
                      Create your first Content Pass today and unlock a new revenue stream while offering 
                      your community exclusive content they'll value.
                    </p>
                    
                    <motion.button
                      onClick={handleCreatePass}
                      whileHover={PASSES_ENABLED ? { scale: 1.05, boxShadow: '0 10px 30px rgba(250, 117, 23, 0.3)' } : {}}
                      whileTap={PASSES_ENABLED ? { scale: 0.95 } : {}}
                      className={`px-10 py-5 rounded-xl text-lg font-bold flex items-center gap-3 mx-auto ${PASSES_ENABLED ? 'bg-gradient-to-r from-[#fa7517] to-[#ff8c3a] text-black shadow-lg shadow-[#fa7517]/20' : 'bg-gray-700/50 text-white/70 cursor-not-allowed'}`}
                    >
                      <Crown className="w-6 h-6" />
                      {PASSES_ENABLED ? 'Create Content Pass' : 'Coming Soon'}
                    </motion.button>
                  </motion.div>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="bg-black/30 rounded-2xl border border-gray-800/50 backdrop-blur-sm overflow-hidden">
                <div className="p-8 border-b border-gray-800/50">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <MessageCircle className="w-7 h-7 text-[#fa7517]" />
                    Frequently Asked Questions
                  </h2>
                  <p className="text-gray-400 mt-2">
                    Everything you need to know about NFT Content Passes
              </p>
            </div>

                <div className="divide-y divide-gray-800/50">
                  {faqItems.map((item, index) => (
                    <div key={index} className="px-8 py-6">
                      <button
                        className="w-full flex justify-between items-center text-left focus:outline-none"
                        onClick={() => toggleFaq(index)}
                      >
                        <h3 className="text-lg font-medium text-white">{item.question}</h3>
                        {expandedFaq === index ? (
                          <ChevronUp className="w-5 h-5 text-[#fa7517]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#fa7517]" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedFaq === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <p className="text-gray-300 mt-4">{item.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </section>

              {/* Simulator CTA Section - Kept but moved to bottom */}
              <section className="text-center space-y-4">                
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Curious about the potential earnings from your Content Pass? 
                  Try our simulator to get customized revenue projections.
                </p>
                
              <Link to="/creator-hub/nft-simulator">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-black/40 border border-gray-700 hover:border-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                    Try the Revenue Simulator
                </motion.button>
              </Link>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </ChannelSelectionProvider>
  );
};

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon: Icon, title, description }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-black/30 rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm relative overflow-hidden"
  >
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fa7517]/50 to-transparent"></div>
    <Icon className="w-8 h-8 text-[#fa7517] mb-4" />
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

export default MonetizationInfo; 