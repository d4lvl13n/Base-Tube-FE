import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { 
  UserPlus, 
  Video, 
  CreditCard, 
  Share2,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const HowToSection = styled.section`
  position: relative;
  padding: 6rem 0;
  background: #000;
  overflow: hidden;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(250, 117, 23, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 140, 58, 0.05) 0%, transparent 50%);
  opacity: 0.5;
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

const StepsContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
`;

const StepCard = styled(motion.div)`
  position: relative;
  display: flex;
  gap: 2rem;
  align-items: center;
  padding: 2rem;
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(250, 117, 23, 0.2);
  border-radius: 1.5rem;
  overflow: hidden;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(250, 117, 23, 0.6), transparent);
    transform: translateX(-100%);
    animation: shimmer 3s infinite;
  }
  
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
`;

const StepNumber = styled.div`
  position: relative;
  min-width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: #fa7517;
  background: rgba(250, 117, 23, 0.1);
  border: 2px solid rgba(250, 117, 23, 0.3);
  border-radius: 50%;
  
  &::after {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: linear-gradient(135deg, transparent, rgba(250, 117, 23, 0.2));
    animation: rotate 3s linear infinite;
    z-index: -1;
  }
  
  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #ffffff;
`;

const StepDescription = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const StepFeatures = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const FeatureTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: rgba(250, 117, 23, 0.1);
  border: 1px solid rgba(250, 117, 23, 0.2);
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #ff8c3a;
`;

const IconWrapper = styled(motion.div)`
  min-width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(250, 117, 23, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%);
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(250, 117, 23, 0.3));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  ${StepCard}:hover &::before {
    opacity: 1;
  }
`;

const CTASection = styled(motion.div)`
  text-align: center;
  margin-top: 4rem;
  padding: 3rem;
  background: linear-gradient(135deg, rgba(250, 117, 23, 0.1) 0%, rgba(20, 20, 20, 0.6) 100%);
  border-radius: 1.5rem;
  border: 1px solid rgba(250, 117, 23, 0.3);
`;

const CTATitle = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #ffffff;
`;

const CTAButton = styled(motion.button)`
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #fa7517 0%, #ea580c 100%);
  color: white;
  font-weight: 600;
  font-size: 1.125rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px -5px rgba(250, 117, 23, 0.4);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 35px -5px rgba(250, 117, 23, 0.5);
  }
`;

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up in seconds with your email or social accounts. Get instant access to all creator tools.',
    features: ['Free to start', 'No credit card required', 'Instant verification']
  },
  {
    number: 2,
    icon: Video,
    title: 'Upload & Create Passes',
    description: 'Connect your YouTube channel, select videos, and create exclusive content passes with custom pricing.',
    features: ['YouTube integration', 'Batch upload', 'Smart pricing']
  },
  {
    number: 3,
    icon: CreditCard,
    title: 'Set Your Pricing',
    description: 'Choose your pass tier, set competitive prices, and define supply limits to create scarcity.',
    features: ['Flexible pricing', 'Multiple currencies', 'Limited editions']
  },
  {
    number: 4,
    icon: Share2,
    title: 'Share & Earn',
    description: 'Get your unique pass link, share with your audience, and start earning instantly from every sale.',
    features: ['Custom links', 'Real-time analytics', 'Instant payouts']
  }
];

const HowTo: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <HowToSection>
      <BackgroundPattern />
      
      <Container>
        <SectionHeader>
          <BadgeWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <Badge>Simple Process</Badge>
          </BadgeWrapper>
          
          <SectionTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            How to Get <GradientText>Started</GradientText>
          </SectionTitle>
          
          <SectionSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            From account creation to earning your first dollar in just 4 simple steps
          </SectionSubtitle>
        </SectionHeader>
        
        <StepsContainer
          as={motion.div}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {steps.map((step, index) => (
            <StepCard
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <StepNumber>{step.number}</StepNumber>
              
              <IconWrapper
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.2
                }}
              >
                <step.icon className="w-12 h-12 text-orange-400" />
              </IconWrapper>
              
              <StepContent>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
                <StepFeatures>
                  {step.features.map((feature, idx) => (
                    <FeatureTag key={idx}>
                      <CheckCircle className="w-3 h-3" />
                      {feature}
                    </FeatureTag>
                  ))}
                </StepFeatures>
              </StepContent>
            </StepCard>
          ))}
          
          {/* Connecting Line */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: '40px',
              width: '2px',
              height: '100%',
              zIndex: 0
            }}
          >
            <motion.line
              x1="1"
              y1="0"
              x2="1"
              y2="100%"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="8 8"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fa7517" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#ea580c" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fa7517" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
        </StepsContainer>
        
        <CTASection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <CTATitle>Ready to Start Your Journey?</CTATitle>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
            Join thousands of creators who are already monetizing their content
          </p>
          <CTAButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </CTAButton>
        </CTASection>
      </Container>
    </HowToSection>
  );
};

export default HowTo; 