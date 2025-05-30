import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { 
  Shield, 
  Zap, 
  DollarSign, 
  Users, 
  Lock, 
  BarChart3,
  Video,
  Sparkles
} from 'lucide-react';

const FeaturesSection = styled.section`
  position: relative;
  padding: 6rem 0;
  background: #000;
  overflow: hidden;
`;

const BackgroundDecoration = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background: 
    radial-gradient(circle at 20% 80%, rgba(250, 117, 23, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(255, 140, 58, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(234, 88, 12, 0.05) 0%, transparent 60%);
`;

const Container = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const BadgeWrapper = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(250, 117, 23, 0.1);
  border: 1px solid rgba(250, 117, 23, 0.3);
  border-radius: 9999px;
  margin-bottom: 1rem;
`;

const Badge = styled.span`
  font-size: 0.875rem;
  color: #ff8c3a;
  font-weight: 500;
`;

const SectionTitle = styled(motion.h2)`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    font-size: 3.5rem;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(135deg, #ff8c3a 0%, #fa7517 50%, #ea580c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const SectionSubtitle = styled(motion.p)`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 700px;
  margin: 0 auto;
`;

const FeaturesGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(motion.div)`
  position: relative;
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(250, 117, 23, 0.2);
  border-radius: 1.5rem;
  padding: 2.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(250, 117, 23, 0.6), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-5px);
    border-color: rgba(250, 117, 23, 0.4);
    box-shadow: 
      0 25px 50px -12px rgba(250, 117, 23, 0.25),
      inset 0 0 30px rgba(250, 117, 23, 0.05);
    
    &::before {
      opacity: 1;
    }
  }
`;

const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(250, 117, 23, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, #fa7517, #ea580c);
    border-radius: 1rem;
    opacity: 0;
    z-index: -1;
    transition: opacity 0.3s ease;
  }
  
  ${FeatureCard}:hover & {
    &::after {
      opacity: 0.3;
    }
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #ffffff;
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  space: 0.75rem;
`;

const FeatureListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  
  &::before {
    content: '✓';
    color: #ff8c3a;
    font-weight: bold;
    font-size: 1.1rem;
  }
`;

const HighlightCard = styled(FeatureCard)`
  grid-column: span 2;
  background: 
    linear-gradient(135deg, rgba(250, 117, 23, 0.1) 0%, rgba(20, 20, 20, 0.6) 100%),
    rgba(20, 20, 20, 0.4);
  border-color: rgba(250, 117, 23, 0.3);
  
  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

const features = [
  {
    icon: Lock,
    title: 'Secure Content Protection',
    description: 'Advanced encryption and token-gating ensure your premium content stays exclusive to pass holders.',
    highlights: ['End-to-end encryption', 'Blockchain verification', 'Access control']
  },
  {
    icon: DollarSign,
    title: 'Instant Monetization',
    description: 'Start earning from your content immediately with our seamless payment integration.',
    highlights: ['Stripe integration', 'Multiple currencies', 'Instant payouts']
  },
  {
    icon: Users,
    title: 'Community Building',
    description: 'Foster an engaged community of supporters who value your exclusive content.',
    highlights: ['Member analytics', 'Direct messaging', 'Exclusive events']
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get detailed insights into your content performance and audience engagement.',
    highlights: ['Real-time stats', 'Revenue tracking', 'Audience insights']
  },
  {
    icon: Video,
    title: 'Multi-Platform Support',
    description: 'Support for YouTube, Twitch, and other major video platforms in one unified system.',
    highlights: ['YouTube integration', 'Twitch support', 'Custom hosting']
  },
  {
    icon: Shield,
    title: 'Creator Protection',
    description: 'Your content and earnings are protected with our robust security measures.',
    highlights: ['Copyright protection', 'Fraud prevention', '24/7 support']
  }
];

const Feature: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <FeaturesSection>
      <BackgroundDecoration />
      
      <Container>
        <SectionHeader>
          <BadgeWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <Badge>Powerful Features</Badge>
          </BadgeWrapper>
          
          <SectionTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Everything You Need to <GradientText>Succeed</GradientText>
          </SectionTitle>
          
          <SectionSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Built with creators in mind, our platform provides all the tools you need to monetize your content effectively.
          </SectionSubtitle>
        </SectionHeader>
        
        <FeaturesGrid
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.slice(0, 2).map((feature, index) => (
            <FeatureCard
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <IconWrapper>
                <feature.icon className="w-6 h-6 text-orange-400" />
              </IconWrapper>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <FeatureList>
                {feature.highlights.map((highlight, idx) => (
                  <FeatureListItem key={idx}>{highlight}</FeatureListItem>
                ))}
              </FeatureList>
            </FeatureCard>
          ))}
          
          <HighlightCard
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <IconWrapper>
                  <Zap className="w-6 h-6 text-orange-400" />
                </IconWrapper>
                <FeatureTitle>Lightning Fast Setup</FeatureTitle>
                <FeatureDescription>
                  Get started in minutes with our intuitive creator dashboard. No technical knowledge required.
                </FeatureDescription>
                <FeatureList>
                  <FeatureListItem>One-click YouTube integration</FeatureListItem>
                  <FeatureListItem>Automated pass generation</FeatureListItem>
                  <FeatureListItem>Smart pricing suggestions</FeatureListItem>
                </FeatureList>
              </div>
              <div style={{ flex: 1, minWidth: '250px', textAlign: 'center' }}>
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto',
                    background: 'linear-gradient(135deg, rgba(250, 117, 23, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 40px rgba(250, 117, 23, 0.2)'
                  }}
                >
                  <Zap className="w-20 h-20 text-orange-400" />
                </motion.div>
              </div>
            </div>
          </HighlightCard>
          
          {features.slice(2).map((feature, index) => (
            <FeatureCard
              key={index + 2}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <IconWrapper>
                <feature.icon className="w-6 h-6 text-orange-400" />
              </IconWrapper>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <FeatureList>
                {feature.highlights.map((highlight, idx) => (
                  <FeatureListItem key={idx}>{highlight}</FeatureListItem>
                ))}
              </FeatureList>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </Container>
    </FeaturesSection>
  );
};

export default Feature; 