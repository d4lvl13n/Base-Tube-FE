import React from 'react';
import { motion } from 'framer-motion';
import { Flag, Gift, Info, ScrollText, Star, Trophy } from 'lucide-react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const ExplainerSection = styled.section`
  margin-top: 4rem;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const ExplainerContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.8);
`;

const PointsExplainer: React.FC = () => {
  return (
    <ExplainerSection>
      <ExplainerContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-[#fa7517]" />
            How growth works right now
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <PointCard
              icon={<Star className="w-5 h-5" />}
              title="XP"
              value="Visible now"
              description="XP is the public score used for the current leaderboard phase."
            />
            <PointCard
              icon={<Trophy className="w-5 h-5" />}
              title="Leaderboard"
              value="Growth-backed"
              description="Leaderboard standings now come from the growth engine, not a fixed activity formula."
            />
            <PointCard
              icon={<Flag className="w-5 h-5" />}
              title="Missions"
              value="Phase-aware"
              description="Mission progress, rewards, and completion all come from the growth system."
            />
            <PointCard
              icon={<ScrollText className="w-5 h-5" />}
              title="History"
              value="Ledger view"
              description="Recent earning and burn events are shown as growth history entries."
            />
            <PointCard
              icon={<Gift className="w-5 h-5" />}
              title="Rewards"
              value="When visible"
              description="Rewards and credits only appear when the active growth phase enables them."
            />
          </div>

          <div className="mt-8 p-4 rounded-lg bg-[#fa7517]/10 border border-[#fa7517]/20">
            <h3 className="text-lg font-semibold mb-2 text-white">What to expect</h3>
            <p className="text-white/70">
              XP is visible first. Reputation, credits, quests, and rewards can stay hidden until the backend enables them for the active phase.
            </p>
            <Link to="/profile" className="inline-flex mt-4 text-[#fa7517] hover:text-[#ff8c3a] font-medium">
              View your growth dashboard
            </Link>
          </div>
        </motion.div>
      </ExplainerContent>
    </ExplainerSection>
  );
};

interface PointCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

const PointCard: React.FC<PointCardProps> = ({ icon, title, value, description }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="p-4 rounded-lg bg-white/5 border border-white/10"
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="text-[#fa7517]">{icon}</div>
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <div className="text-2xl font-bold text-[#fa7517]">{value}</div>
    <p className="text-sm text-white/60">{description}</p>
  </motion.div>
);

export default PointsExplainer; 
