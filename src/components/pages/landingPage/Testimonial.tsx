import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Star, Quote, TrendingUp, Sparkles } from 'lucide-react';

const TestimonialSection = styled.section`
  position: relative;
  padding: 6rem 0;
  background: #000;
  overflow: hidden;
`;

const BackgroundGlow = styled.div`
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 50% 50%, rgba(250, 117, 23, 0.1) 0%, transparent 50%);
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

const TestimonialsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const TestimonialCard = styled(motion.div)`
  position: relative;
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(250, 117, 23, 0.2);
  border-radius: 1.5rem;
  padding: 2rem;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(250, 117, 23, 0.1) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    border-color: rgba(250, 117, 23, 0.4);
    transform: translateY(-5px);
    
    &::before {
      opacity: 1;
    }
  }
`;

const QuoteIcon = styled(Quote)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  color: rgba(250, 117, 23, 0.2);
  transform: rotate(180deg);
`;

const TestimonialContent = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.7;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AuthorAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fa7517, #ea580c);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1.25rem;
`;

const AuthorDetails = styled.div`
  flex: 1;
`;

const AuthorName = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
`;

const AuthorRole = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`;

const Rating = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const StarIcon = styled(Star)<{ filled: boolean }>`
  width: 20px;
  height: 20px;
  color: ${props => props.filled ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)'};
  fill: ${props => props.filled ? '#fbbf24' : 'none'};
`;

const StatsContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 4rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(250, 117, 23, 0.1) 0%, rgba(20, 20, 20, 0.6) 100%);
  border-radius: 1.5rem;
  border: 1px solid rgba(250, 117, 23, 0.3);
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  background: rgba(250, 117, 23, 0.1);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatValue = styled(motion.div)`
  font-size: 2rem;
  font-weight: 700;
  color: #ff8c3a;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`;

const FeatureHighlight = styled(motion.div)`
  grid-column: span 2;
  padding: 2rem;
  text-align: center;
  
  @media (max-width: 768px) {
    grid-column: span 1;
  }
`;

const testimonials = [
  {
    content: "Pass-as-a-Link transformed how I monetize my tutorials. I went from $500 to $5,000 monthly in just 3 months!",
    author: "Sarah Chen",
    role: "Tech YouTuber",
    initials: "SC",
    rating: 5,
    highlight: "10x Revenue Growth"
  },
  {
    content: "The platform is incredibly intuitive. I created my first content pass in under 10 minutes and made my first sale that same day.",
    author: "Marcus Rodriguez",
    role: "Fitness Creator",
    initials: "MR",
    rating: 5,
    highlight: "Instant Setup"
  },
  {
    content: "Finally, a way to truly reward my most loyal fans with exclusive content while earning what my work is worth.",
    author: "Emma Thompson",
    role: "Art Instructor",
    initials: "ET",
    rating: 5,
    highlight: "Fair Compensation"
  },
  {
    content: "The analytics dashboard gives me insights I never had before. I can see exactly what content resonates with my audience.",
    author: "David Kim",
    role: "Music Producer",
    initials: "DK",
    rating: 5,
    highlight: "Data-Driven"
  },
  {
    content: "Customer support is outstanding. They helped me optimize my pricing strategy and I doubled my conversions.",
    author: "Lisa Johnson",
    role: "Cooking Channel",
    initials: "LJ",
    rating: 5,
    highlight: "Amazing Support"
  },
  {
    content: "The YouTube integration is seamless. I can monetize my unlisted videos without any technical hassle.",
    author: "Alex Patel",
    role: "Gaming Creator",
    initials: "AP",
    rating: 5,
    highlight: "Easy Integration"
  }
];

const stats = [
  { value: 10000, suffix: '+', label: 'Active Creators', icon: '👥' },
  { value: 2.5, suffix: 'M+', label: 'Total Earnings', icon: '💰' },
  { value: 98, suffix: '%', label: 'Creator Satisfaction', icon: '⭐' },
  { value: 50000, suffix: '+', label: 'Passes Sold', icon: '🎫' }
];

const Testimonial: React.FC = () => {
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
    <TestimonialSection>
      <BackgroundGlow />
      
      <Container>
        <SectionHeader>
          <BadgeWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <Badge>Creator Success Stories</Badge>
          </BadgeWrapper>
          
          <SectionTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Loved by <GradientText>Creators</GradientText> Worldwide
          </SectionTitle>
        </SectionHeader>
        
        <TestimonialsGrid
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <QuoteIcon />
              
              <Rating>
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} filled={i < testimonial.rating} />
                ))}
              </Rating>
              
              <TestimonialContent>
                "{testimonial.content}"
              </TestimonialContent>
              
              <AuthorInfo>
                <AuthorAvatar>{testimonial.initials}</AuthorAvatar>
                <AuthorDetails>
                  <AuthorName>{testimonial.author}</AuthorName>
                  <AuthorRole>{testimonial.role}</AuthorRole>
                </AuthorDetails>
              </AuthorInfo>
              
              {testimonial.highlight && (
                <motion.div
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(250, 117, 23, 0.1)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#ff8c3a',
                    textAlign: 'center',
                    fontWeight: 500
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  {testimonial.highlight}
                </motion.div>
              )}
            </TestimonialCard>
          ))}
        </TestimonialsGrid>
        
        <StatsContainer
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {stats.map((stat, index) => (
            <StatItem key={index}>
              <StatIcon>
                <span style={{ fontSize: '2rem' }}>{stat.icon}</span>
              </StatIcon>
              <StatValue
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100,
                  delay: index * 0.1 
                }}
              >
                {stat.value}{stat.suffix}
              </StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatItem>
          ))}
          
          <FeatureHighlight
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(250, 117, 23, 0.1), transparent)',
              backgroundSize: '200% 100%',
            }}
          >
            <TrendingUp className="w-12 h-12 text-orange-400 mx-auto mb-2" />
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff' }}>
              Join the fastest growing creator economy platform
            </p>
          </FeatureHighlight>
        </StatsContainer>
      </Container>
    </TestimonialSection>
  );
};

export default Testimonial; 