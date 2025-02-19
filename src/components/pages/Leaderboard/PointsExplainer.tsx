import React from 'react';
import { motion } from 'framer-motion';
import { Info, Video, MessageSquare, Heart, Eye, Clock } from 'lucide-react';
import styled from 'styled-components';

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
            How Points Are Calculated
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <PointCard
              icon={<Video className="w-5 h-5" />}
              title="Content Creation"
              points={5}
              description="Points per video upload"
            />
            <PointCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="Comments"
              points={2}
              description="Points per comment"
            />
            <PointCard
              icon={<Heart className="w-5 h-5" />}
              title="Likes"
              points={0.5}
              description="Points per like given"
            />
            <PointCard
              icon={<Eye className="w-5 h-5" />}
              title="Views"
              points={0.1}
              description="Points per video view"
            />
            <PointCard
              icon={<Clock className="w-5 h-5" />}
              title="Watch Time"
              points={1}
              description="Points per minute watched"
            />
          </div>

          <div className="mt-8 p-4 rounded-lg bg-[#fa7517]/10 border border-[#fa7517]/20">
            <h3 className="text-lg font-semibold mb-2 text-white">Pro Tip 💡</h3>
            <p className="text-white/70">
              Stay active in the community by creating quality content, engaging in meaningful discussions,
              and supporting other creators. Your score updates regularly to reflect your engagement!
            </p>
          </div>
        </motion.div>
      </ExplainerContent>
    </ExplainerSection>
  );
};

interface PointCardProps {
  icon: React.ReactNode;
  title: string;
  points: number;
  description: string;
}

const PointCard: React.FC<PointCardProps> = ({ icon, title, points, description }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="p-4 rounded-lg bg-white/5 border border-white/10"
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="text-[#fa7517]">{icon}</div>
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <div className="text-2xl font-bold text-[#fa7517]">{points} pts</div>
    <p className="text-sm text-white/60">{description}</p>
  </motion.div>
);

export default PointsExplainer; 