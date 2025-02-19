import styled, { keyframes, css } from 'styled-components';
import { motion } from 'framer-motion';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(250, 117, 23, 0.5); }
  50% { box-shadow: 0 0 20px rgba(250, 117, 23, 0.8); }
  100% { box-shadow: 0 0 5px rgba(250, 117, 23, 0.5); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

// Base Container
export const LeaderboardContainer = styled.div`
  max-width: 1920px;
  margin: 0 auto;
  padding-top: 64px; // Account for header height
  min-height: 100vh;
  background: black;
  position: relative;
  overflow: hidden;
`;

// Header Styles
export const LeaderboardHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  position: relative;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }

  .header-icon {
    color: #fa7517;
    animation: ${float} 3s ease-in-out infinite;
  }

  h1 {
    font-size: 3.5rem;
    background: linear-gradient(135deg, #fa7517 0%, #ffd700 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
    font-weight: 800;
    letter-spacing: -1px;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.2rem;
  }
`;

// Loading and Error States
export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 2rem;
  color: rgba(255, 255, 255, 0.7);
`;

export const ErrorContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #fa7517;
`;

// Top Three Section
export const TopThreeContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 0 auto 4rem;
  max-width: 900px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
`;

export const RankBadgeContainer = styled.div<{ isTopThree?: boolean }>`
  position: absolute;
  top: ${({ isTopThree }) => isTopThree ? '-1.25rem' : '1rem'};
  right: ${({ isTopThree }) => isTopThree ? '-1.25rem' : '1rem'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ isTopThree }) => isTopThree ? '3.5rem' : '2.5rem'};
  height: ${({ isTopThree }) => isTopThree ? '3.5rem' : '2.5rem'};
  z-index: 10;
`;

export const RankBadge = styled.div<{ rank: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ rank }) => rank <= 3 ? '3.5rem' : '2rem'};
  height: ${({ rank }) => rank <= 3 ? '3.5rem' : '2rem'};
  border-radius: 50%;
  font-weight: 600;
  font-size: ${({ rank }) => rank <= 3 ? '1.25rem' : '0.875rem'};
  background: ${({ rank }) => 
    rank === 1 ? 'linear-gradient(135deg, #ffd700 0%, #fa7517 100%)' :
    rank === 2 ? 'linear-gradient(135deg, #c0c0c0 0%, #fa7517 100%)' :
    rank === 3 ? 'linear-gradient(135deg, #cd7f32 0%, #fa7517 100%)' :
    rank <= 10 ? 'linear-gradient(135deg, #fa7517 0%, #ffd700 100%)' :
    'rgba(255, 255, 255, 0.1)'};
  color: ${({ rank }) => rank <= 10 ? '#000' : 'rgba(255, 255, 255, 0.8)'};
  border: ${({ rank }) => 
    rank <= 3 
      ? '3px solid #fa7517'
      : rank <= 10 
        ? '2px solid #fa7517'
        : '2px solid rgba(255, 255, 255, 0.1)'};
  box-shadow: ${({ rank }) => 
    rank <= 3 
      ? '0 0 20px rgba(250, 117, 23, 0.5)'
      : rank <= 10 
        ? '0 0 10px rgba(250, 117, 23, 0.3)'
        : 'none'};
  transition: all 0.3s ease;

  svg {
    width: ${({ rank }) => rank <= 3 ? '1.75rem' : '1.25rem'};
    height: ${({ rank }) => rank <= 3 ? '1.75rem' : '1.25rem'};
    color: #000;
  }

  &:hover {
    transform: scale(1.1);
  }
`;

export const GradientBorder = styled.div<{ position: number }>`
  position: relative;
  padding: 3px;
  background: ${({ position }) => 
    position === 1 
      ? 'linear-gradient(45deg, #ffd700, #fa7517)' 
      : position === 2 
      ? 'linear-gradient(45deg, #c0c0c0, #fa7517)' 
      : 'linear-gradient(45deg, #cd7f32, #fa7517)'};
  border-radius: 1.5rem;
  width: 100%;
  height: 100%;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: inherit;
    filter: blur(10px);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
`;

export const TopUserCard = styled(motion.div)<{ position: number }>`
  position: relative;
  background: #111111;
  border-radius: 1.5rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px) scale(1.02);
    
    ${GradientBorder}::before {
      opacity: 0.5;
    }
  }
`;

// User Elements
export const UserAvatar = styled.div<{ src: string; size?: 'small' | 'medium' | 'large' }>`
  width: ${({ size }) => 
    size === 'large' ? '120px' : 
    size === 'medium' ? '60px' : 
    '40px'};
  height: ${({ size }) => 
    size === 'large' ? '120px' : 
    size === 'medium' ? '60px' : 
    '40px'};
  border-radius: 50%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-color: #1a1a1a;
  margin: 0 auto;
  border: 2px solid rgba(250, 117, 23, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, rgba(250, 117, 23, 0.1), transparent);
  }

  @media (max-width: 768px) {
    width: ${({ size }) => 
      size === 'large' ? '80px' : 
      size === 'medium' ? '50px' : 
      '32px'};
    height: ${({ size }) => 
      size === 'large' ? '80px' : 
      size === 'medium' ? '50px' : 
      '32px'};
  }
`;

export const Username = styled.h3`
  color: white;
  font-size: 1.2rem;
  margin: 0.5rem 0;
  font-weight: 600;
`;

// Stats Elements
export const StatsContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const StatBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;

  svg {
    color: #fa7517;
  }
`;

export const ScoreHighlight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fa7517;
  margin-top: 1rem;

  svg {
    animation: ${rotate} 2s linear infinite;
  }
`;

// Table Elements
export const LeaderboardTable = styled.div`
  background: #111111;
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(250, 117, 23, 0.2);
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 2fr repeat(6, 1fr);
  padding: 1rem;
  background: rgba(250, 117, 23, 0.1);
  font-weight: 600;
  color: white;

  @media (max-width: 1024px) {
    grid-template-columns: 0.5fr 2fr repeat(3, 1fr);
    div:nth-child(n+6) {
      display: none;
    }
  }
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 2fr repeat(6, 1fr);
  padding: 1rem;
  border-bottom: 1px solid rgba(250, 117, 23, 0.1);
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(250, 117, 23, 0.05);
  }

  @media (max-width: 1024px) {
    grid-template-columns: 0.5fr 2fr repeat(3, 1fr);
    div:nth-child(n+6) {
      display: none;
    }
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
`;

export const Position = styled.div`
  font-weight: 600;
  color: white;
`;

export const CategoryTabs = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 2rem auto;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  max-width: 90%;
  
  @media (max-width: 768px) {
    justify-content: flex-start; // Allow content to scroll
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch; // Smooth scrolling on iOS
    scrollbar-width: none; // Hide scrollbar on Firefox
    -ms-overflow-style: none; // Hide scrollbar on IE/Edge
    padding: 0.75rem;
    
    &::-webkit-scrollbar {
      display: none; // Hide scrollbar on Chrome/Safari
    }
    
    // Add horizontal padding to prevent edge items from touching screen edges
    &::before,
    &::after {
      content: '';
      min-width: 0.5rem;
    }
  }
`;

export const TabButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  white-space: nowrap;
  border-radius: 0.75rem;
  border: none;
  background: ${({ active }) => active ? 'rgba(250, 117, 23, 0.2)' : 'transparent'};
  color: ${({ active }) => active ? '#fa7517' : 'rgba(255, 255, 255, 0.7)'};
  transition: all 0.3s ease;
  font-weight: ${({ active }) => active ? '600' : '400'};
  
  &:hover {
    background: rgba(250, 117, 23, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    flex-shrink: 0; // Prevent tabs from shrinking
    
    // Make the icon smaller on mobile
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

export const PodiumSection = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin: 0 auto 4rem;
  max-width: 1000px;
  padding: 2rem;
  position: relative;

  @media (max-width: 768px) {
    gap: 1rem;
    padding: 1rem;
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(250, 117, 23, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }
`;

export const PodiumStep = styled(motion.div)<{ position: number }>`
  position: relative;
  padding: 2rem;
  background: #111111;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  order: ${({ position }) => (position === 1 ? 0 : position)};
  transform: translateY(${({ position }) => (position === 1 ? '0' : position === 2 ? '2rem' : '4rem')});
  box-shadow: 0 0 20px rgba(250, 117, 23, 0.15);

  @media (max-width: 768px) {
    padding: 1rem;
    transform: translateY(${({ position }) => (position === 1 ? '0' : position === 2 ? '1rem' : '2rem')});
  }

  border: 1px solid rgba(250, 117, 23, 0.2);

  &:hover {
    transform: translateY(${({ position }) => (position === 1 ? '-10px' : position === 2 ? 'calc(2rem - 10px)' : 'calc(4rem - 10px)')});
    background: #161616;
    box-shadow: 0 0 30px rgba(250, 117, 23, 0.3);

    @media (max-width: 768px) {
      transform: translateY(${({ position }) => (position === 1 ? '-5px' : position === 2 ? 'calc(1rem - 5px)' : 'calc(2rem - 5px)')});
    }

    &::before {
      opacity: 1;
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 1.6rem;
    background: ${({ position }) => 
      position === 1 
        ? 'linear-gradient(45deg, #ffd700, #fa7517)' 
        : position === 2 
        ? 'linear-gradient(45deg, #c0c0c0, #fa7517)' 
        : 'linear-gradient(45deg, #cd7f32, #fa7517)'};
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
`;

export const LeaderboardGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  padding: 2rem;
  margin: 0 auto;
  max-width: 1400px;
  
  // Responsive grid layout
  grid-template-columns: repeat(3, 1fr); // 3 items per row on desktop
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr); // 2 items per row on tablet
    gap: 1rem;
    padding: 1.5rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr; // 1 item per row on mobile
    padding: 1rem;
  }
`;

export const RankingBadge = styled.div`
  background: #1a1a1a;
  border: 2px solid rgba(250, 117, 23, 0.3);
  color: #fa7517;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

export const LeaderboardGridItem = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(250, 117, 23, 0.3);
    
    ${RankingBadge} {
      transform: scale(1.1);
    }
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    color: #fa7517;
    font-weight: 500;
  }
`;

export const CreatorCard = styled(motion.div)`
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
  }

  .rank {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .info {
    flex: 1;
  }
`;

export const CreatorSpotlight = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(250, 117, 23, 0.3);
  border-radius: 2rem;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

export const GlowingOrb = styled.div`
  width: 50px;
  height: 50px;
  background: radial-gradient(circle at 30% 30%, #fa7517, transparent);
  border-radius: 50%;
  animation: ${glow} 1.5s ease-in-out infinite;
`;

export const LeaderLine = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(to bottom, #fa7517, transparent);
`;

export const RankProgress = styled.div<{ score: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: ${({ score }) => (score / 100) * 100}%;
  background: linear-gradient(to right, #fa7517, #ffd700);
  transition: width 1s ease-in-out;
`;

export const SpotlightStats = styled.div<{ user: any }>`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const HeroSection = styled.div`
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(250, 117, 23, 0.2),
      rgba(250, 117, 23, 0.4),
      rgba(250, 117, 23, 0.2),
      transparent
    );
  }
`;

export const GlowingBackground = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 0%,
    rgba(250, 117, 23, 0.15),
    transparent 70%
  );

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/assets/grid.png') repeat;
    opacity: 0.1;
    animation: ${pulse} 4s ease-in-out infinite;
  }
`;

export const HeroTitle = styled.h1`
  font-size: 5rem;
  font-weight: 800;
  letter-spacing: -2px;
  margin-bottom: 1.5rem;
  background: linear-gradient(
    to bottom right,
    #ffffff,
    #fa7517,
    #ffd700
  );
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 0 30px rgba(250, 117, 23, 0.3);
  
  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

export const HeroSubtitle = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;