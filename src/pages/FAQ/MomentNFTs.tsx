import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Trophy,
  HelpCircle,
  ArrowLeft,
  Award,
  Clock,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <div className="inline-block px-4 py-2 mb-4 rounded-lg bg-black/80 border border-gray-800/30 backdrop-blur-sm">
      <h2 className="text-xl font-semibold bg-gradient-to-r from-[#fa7517] to-white bg-clip-text text-transparent">
        {title}
      </h2>
    </div>
    <div className="space-y-4 text-gray-300">
      {children}
    </div>
  </div>
);

const RankCard: React.FC<{ title: string; points: string; description: string }> = ({ 
  title, 
  points, 
  description 
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="p-4 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
  >
    <div className="flex items-center gap-3 mb-2">
      <Award className="w-5 h-5 text-[#fa7517]" />
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <p className="text-sm text-[#fa7517] mb-2">{points}</p>
    <p className="text-sm text-gray-400">{description}</p>
  </motion.div>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="p-4 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
  >
    <h3 className="font-semibold text-white mb-2">{question}</h3>
    <p className="text-sm text-gray-400">{answer}</p>
  </motion.div>
);

const MomentNFTsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#09090B]">
      <Header />
      <div className="flex">
        <Sidebar />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 container mx-auto px-4 py-24 max-w-4xl"
        >
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/faq">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-black/50 border border-gray-800/30"
              >
                <ArrowLeft className="w-5 h-5 text-[#fa7517]" />
              </motion.button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-6 h-6 text-[#fa7517]" />
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  Base.Tube Epoch NFTs & Ranking System
                </h1>
              </div>
              <p className="text-gray-400">
                Learn about our unique NFT rewards system and how to earn them
              </p>
            </div>
          </div>

          {/* Welcome Section */}
          <Section title="Welcome">
            <p>
              Welcome to Base.Tube's Epoch NFTs & Ranking System—a unique way to celebrate your engagement 
              on our platform. Whether you're here to watch or create, every interaction counts and 
              brings you closer to unlocking exclusive achievements and rewards. Read on to learn how 
              it works and what benefits you can earn.
            </p>
          </Section>

          {/* What Are Base.Tube Epoch NFTs Section */}
          <Section title="What Are Base.Tube Epoch NFTs?">
            <p>
              Base.Tube Epoch NFTs are unique digital collectibles that capture significant moments from our platform's content. When you hit a milestone, you'll have the opportunity to claim a unique NFT 
              that represents your rank for the current season. These Epoch NFTs aren't just collectibles—they're 
              a symbol of your journey and a passport to exclusive end-of-season rewards.
            </p>
          </Section>

          {/* Ranking System Section */}
          <Section title="How Does the Ranking System Work?">
            <div className="space-y-6">
              <p>
                Our ranking system is designed to be clear, engaging, and inclusive for everyone.
                Instead of numbered levels, we use ranks that describe your journey:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RankCard
                  title="Rising Voyager"
                  points="0 – 49 points"
                  description="Every journey begins with a single step. Start here and explore what Base.Tube has to offer!"
                />
                <RankCard
                  title="Engaged Contributor"
                  points="50 – 249 points"
                  description="Your active participation is noticed. Keep engaging, and you'll soon climb the ranks!"
                />
                <RankCard
                  title="Community Builder"
                  points="250 – 499 points"
                  description="You're forging connections and making an impact in our community."
                />
                <RankCard
                  title="Platform Pioneer"
                  points="500 – 1,249 points"
                  description="You're pushing boundaries and setting trends on Base.Tube."
                />
                <RankCard
                  title="Innovative Icon"
                  points="1,250 – 2,499 points"
                  description="Your contributions are truly exceptional, inspiring others across the platform."
                />
                <RankCard
                  title="Base.Tube Legend"
                  points="2,500+ points"
                  description="The pinnacle of achievement—a status reserved for those whose impact transforms the ecosystem."
                />
              </div>
            </div>
          </Section>

          {/* Points Earning Section */}
          <Section title="How Do I Earn Points?">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Video Uploads', value: '5 points per upload', icon: Star },
                { label: 'Comments', value: '2 points per comment', icon: HelpCircle },
                { label: 'Video Views', value: '0.1 point per view', icon: Trophy },
                { label: 'Likes Given', value: '0.5 point per like', icon: Award },
                { label: 'Watch Time', value: '1 point per minute watched', icon: Clock },
                { label: 'Creator Bonus', value: '0.05 points per view', icon: Star }
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-[#fa7517]" />
                    <div>
                      <h3 className="font-semibold text-white">{item.label}</h3>
                      <p className="text-sm text-gray-400">{item.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Benefits Section */}
          <Section title="What Benefits Do I Get?">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Exclusive Airdrops',
                  description: 'Top performers receive special rewards at the end of each season.',
                  icon: Star
                },
                {
                  title: 'Unique Collectibles',
                  description: 'Your Epoch NFT is a unique digital badge showing your status.',
                  icon: Trophy
                },
                {
                  title: 'Community Recognition',
                  description: 'Higher ranks come with greater visibility in our community.',
                  icon: Award
                },
                {
                  title: 'Future Perks',
                  description: 'Access to beta features, early releases, and platform privileges.',
                  icon: Shield
                }
              ].map((benefit) => (
                <motion.div
                  key={benefit.title}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <benefit.icon className="w-5 h-5 text-[#fa7517]" />
                    <h3 className="font-semibold text-white">{benefit.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Claiming Process Section */}
          <Section title="How Do I Claim My Epoch NFT?">
            <div className="space-y-4">
              <p>Once your persistent points in your account hit the threshold for a new rank:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { step: 1, text: "You'll receive an in-app notification that you're eligible" },
                  { step: 2, text: 'A "Claim Your Epoch NFT" button will appear on your profile' },
                  { step: 3, text: 'Confirm the claim via your connected Web3 wallet' },
                  { step: 4, text: 'Your NFT will be minted and added to your wallet' }
                ].map((step) => (
                  <motion.div
                    key={step.step}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fa7517]/10 flex items-center justify-center">
                        <span className="text-[#fa7517] font-semibold">{step.step}</span>
                      </div>
                      <p className="text-gray-300">{step.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* Season End Section */}
          <Section title="What Happens at the End of a Season?">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Points Reset', description: "All users' points are reset for a fresh start" },
                { title: 'Leaderboard Rewards', description: 'Special rewards for top performers' },
                { title: 'NFTs Remain', description: 'Your earned Epoch NFTs stay in your wallet' },
                { title: 'New Opportunities', description: 'New season, new challenges, new rewards' }
              ].map((item) => (
                <motion.div
                  key={item.title}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm"
                >
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* FAQ Section */}
          <Section title="Frequently Asked Questions">
            <div className="space-y-4">
              {[
                {
                  q: "Do I need to be a creator to earn points?",
                  a: "Not at all! Both viewers and creators earn points based on engagement. Every interaction—whether watching, liking, commenting, or uploading—counts."
                },
                {
                  q: "How often are my points updated?",
                  a: "Your points are updated in real-time for the leaderboard and also saved persistently in your account via scheduled background updates."
                },
                {
                  q: "What if I reach the points threshold but forget to claim my NFT?",
                  a: "We encourage you to claim your NFT as soon as you're notified. However, if you miss the claim window, please contact support."
                },
                // ... add other FAQs
              ].map((faq, index) => (
                <FAQItem key={index} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </Section>

          {/* Need More Help Section */}
          <Section title="Need More Help?">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm text-center"
            >
              <p className="text-gray-300 mb-4">
                Join our Discord community for real-time support and discussions with other members.
              </p>
              <div className="flex justify-center gap-4">
                <motion.a
                  href="https://discord.gg/SDdDCjGZHw"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-lg bg-[#5865F2] text-white font-semibold 
                    flex items-center gap-2 hover:bg-[#4752C4] transition-colors duration-200"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Join our Discord
                </motion.a>
              </div>
            </motion.div>
          </Section>
        </motion.div>
      </div>
    </div>
  );
};

export default MomentNFTsPage; 