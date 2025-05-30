import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Play, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = styled.section`
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  overflow: hidden;
  background: #000;
`;

const BackgroundGradient = styled(motion.div)`
  position: absolute;
  inset: 0;
  opacity: 0.4;
  background: radial-gradient(circle at 30% 50%, rgba(250, 117, 23, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 70% 50%, rgba(255, 140, 58, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 50% 100%, rgba(234, 88, 12, 0.1) 0%, transparent 50%);
`;

const GridPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(250, 117, 23, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(250, 117, 23, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at center, transparent 0%, black 70%);
`;

const FloatingOrb = styled(motion.div)<{ size: number; color: string }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background: ${props => props.color};
  filter: blur(40px);
  opacity: 0.5;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
`;

const BadgeWrapper = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(250, 117, 23, 0.1);
  border: 1px solid rgba(250, 117, 23, 0.3);
  border-radius: 9999px;
  margin-bottom: 2rem;
`;

const Badge = styled.span`
  font-size: 0.875rem;
  color: #ff8c3a;
  font-weight: 500;
`;

const MainTitle = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  
  @media (min-width: 768px) {
    font-size: 5rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 6rem;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(135deg, #ff8c3a 0%, #fa7517 50%, #ea580c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
`;

const Subtitle = styled(motion.p)`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 700px;
  margin: 0 auto 3rem;
  line-height: 1.6;
  
  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  
  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const PrimaryButton = styled(motion.button)`
  position: relative;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #fa7517 0%, #ea580c 100%);
  color: white;
  font-weight: 600;
  font-size: 1.125rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px -5px rgba(250, 117, 23, 0.4);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 35px -5px rgba(250, 117, 23, 0.5);
    
    &::before {
      left: 100%;
    }
  }
`;

const SecondaryButton = styled(motion.button)`
  padding: 1rem 2rem;
  background: rgba(250, 117, 23, 0.1);
  color: #ff8c3a;
  font-weight: 600;
  font-size: 1.125rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(250, 117, 23, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(250, 117, 23, 0.2);
    border-color: rgba(250, 117, 23, 0.5);
    transform: translateY(-2px);
  }
`;

const VideoPreview = styled(motion.div)`
  max-width: 900px;
  margin: 5rem auto 0;
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  background: rgba(250, 117, 23, 0.05);
  border: 1px solid rgba(250, 117, 23, 0.2);
  box-shadow: 0 25px 50px -12px rgba(250, 117, 23, 0.25);
`;

const VideoPlaceholder = styled.div`
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, rgba(250, 117, 23, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlayButton = styled(motion.div)`
  width: 80px;
  height: 80px;
  background: rgba(250, 117, 23, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(250, 117, 23, 0.4);
  
  &:hover {
    background: rgba(250, 117, 23, 1);
    transform: scale(1.1);
  }
`;

const StatsContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 600px;
  margin: 3rem auto 0;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #ff8c3a;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`;

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <HeroSection id="hero">
      <BackgroundGradient
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      
      <GridPattern />
      
      <FloatingOrb
        size={600}
        color="radial-gradient(circle, rgba(250, 117, 23, 0.4) 0%, transparent 70%)"
        style={{ top: '-20%', left: '-10%' }}
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <FloatingOrb
        size={400}
        color="radial-gradient(circle, rgba(255, 140, 58, 0.4) 0%, transparent 70%)"
        style={{ bottom: '-10%', right: '-5%' }}
        animate={{
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <ContentWrapper>
        <BadgeWrapper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <Badge>Revolutionizing Content Monetization</Badge>
        </BadgeWrapper>
        
        <MainTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Unlock Premium Content with{' '}
          <GradientText>Pass-as-a-Link</GradientText>
        </MainTitle>
        
        <Subtitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Create exclusive content passes, monetize your videos, and build a thriving community. 
          The future of content creator economy is here.
        </Subtitle>
        
        <ButtonGroup
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <PrimaryButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/creator-hub')}
          >
            <Zap className="w-5 h-5" />
            Start Creating
          </PrimaryButton>
          
          <SecondaryButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/discover')}
          >
            Explore Passes
            <ArrowRight className="w-5 h-5" />
          </SecondaryButton>
        </ButtonGroup>
        
        <VideoPreview
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <VideoPlaceholder>
            <PlayButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </PlayButton>
          </VideoPlaceholder>
        </VideoPreview>
        
        <StatsContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <StatItem>
            <StatNumber>10K+</StatNumber>
            <StatLabel>Active Creators</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>$2M+</StatNumber>
            <StatLabel>Creator Earnings</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>50K+</StatNumber>
            <StatLabel>Passes Sold</StatLabel>
          </StatItem>
        </StatsContainer>
      </ContentWrapper>
    </HeroSection>
  );
};

export default Hero; 