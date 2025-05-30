import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Plus, Minus, HelpCircle, Sparkles } from 'lucide-react';

const FAQSection = styled.section`
  position: relative;
  padding: 6rem 0;
  background: #000;
  overflow: hidden;
`;

const BackgroundMesh = styled.div`
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 30% 30%, rgba(250, 117, 23, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(255, 140, 58, 0.06) 0%, transparent 50%);
  opacity: 0.6;
`;

const Container = styled.div`
  position: relative;
  z-index: 10;
  max-width: 900px;
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
  max-width: 600px;
  margin: 0 auto;
`;

const FAQContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FAQItem = styled(motion.div)<{ isOpen: boolean }>`
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.isOpen ? 'rgba(250, 117, 23, 0.4)' : 'rgba(250, 117, 23, 0.2)'};
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(250, 117, 23, 0.4);
    box-shadow: 0 10px 30px -10px rgba(250, 117, 23, 0.2);
  }
`;

const FAQHeader = styled.button`
  width: 100%;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(250, 117, 23, 0.05);
  }
`;

const FAQQuestion = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  flex: 1;
  margin-right: 1rem;
  
  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const FAQIcon = styled(motion.div)`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(250, 117, 23, 0.1);
  border-radius: 50%;
  flex-shrink: 0;
`;

const FAQContent = styled(motion.div)`
  padding: 0 2rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.7;
`;

const ContactCard = styled(motion.div)`
  margin-top: 4rem;
  padding: 3rem;
  background: linear-gradient(135deg, rgba(250, 117, 23, 0.1) 0%, rgba(20, 20, 20, 0.6) 100%);
  border-radius: 1.5rem;
  border: 1px solid rgba(250, 117, 23, 0.3);
  text-align: center;
`;

const ContactTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
`;

const ContactDescription = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
`;

const ContactButton = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #fa7517 0%, #ea580c 100%);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px -5px rgba(250, 117, 23, 0.4);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 35px -5px rgba(250, 117, 23, 0.5);
  }
`;

const faqs = [
  {
    question: "What is Pass-as-a-Link and how does it work?",
    answer: "Pass-as-a-Link is a content monetization platform that allows creators to sell exclusive access to their videos through unique shareable links. Creators upload unlisted videos, set a price, and generate a pass link. When fans purchase the pass, they gain immediate access to the gated content."
  },
  {
    question: "How much does it cost to start using the platform?",
    answer: "It's completely free to create an account and start making content passes. We only charge a small platform fee (10%) when you make a sale. There are no upfront costs, monthly subscriptions, or hidden fees."
  },
  {
    question: "Which video platforms are supported?",
    answer: "Currently, we support YouTube, Twitch, Instagram, and TikTok. YouTube integration is the most seamless with our one-click verification system. We're continuously adding support for more platforms based on creator demand."
  },
  {
    question: "How do I get paid for my content sales?",
    answer: "Payments are processed through Stripe and deposited directly to your bank account. You can choose between instant payouts (available in select countries) or standard weekly payouts. All major currencies are supported."
  },
  {
    question: "Can I create passes for multiple videos?",
    answer: "Yes! You can create passes that include single videos or bundle multiple videos together. This is perfect for course creators who want to sell complete series or tutorials as a package."
  },
  {
    question: "Is my content protected from piracy?",
    answer: "We use advanced token-gating and encryption to protect your content. Each purchase is tied to a specific user account, and we monitor for suspicious activity. While no system is 100% piracy-proof, we provide industry-leading protection."
  },
  {
    question: "Can I offer discounts or promotional pricing?",
    answer: "Absolutely! You have full control over your pricing strategy. You can create limited-time discounts, early-bird pricing, or special promotional codes for your loyal fans."
  },
  {
    question: "What kind of analytics do I get access to?",
    answer: "Our creator dashboard provides comprehensive analytics including sales data, viewer engagement, geographic distribution, conversion rates, and revenue trends. You'll have all the data you need to optimize your content strategy."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <FAQSection>
      <BackgroundMesh />
      
      <Container>
        <SectionHeader>
          <BadgeWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <Badge>Got Questions?</Badge>
          </BadgeWrapper>
          
          <SectionTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Frequently Asked <GradientText>Questions</GradientText>
          </SectionTitle>
          
          <SectionSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Everything you need to know about monetizing your content
          </SectionSubtitle>
        </SectionHeader>
        
        <FAQContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              isOpen={openIndex === index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <FAQHeader onClick={() => toggleFAQ(index)}>
                <FAQQuestion>{faq.question}</FAQQuestion>
                <FAQIcon
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 text-orange-400" />
                  ) : (
                    <Plus className="w-5 h-5 text-orange-400" />
                  )}
                </FAQIcon>
              </FAQHeader>
              
              <AnimatePresence>
                {openIndex === index && (
                  <FAQContent
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {faq.answer}
                  </FAQContent>
                )}
              </AnimatePresence>
            </FAQItem>
          ))}
        </FAQContainer>
        
        <ContactCard
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <HelpCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <ContactTitle>Still have questions?</ContactTitle>
          <ContactDescription>
            Our support team is here to help you succeed. Reach out anytime!
          </ContactDescription>
          <ContactButton
            href="mailto:support@base.tube"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact Support
          </ContactButton>
        </ContactCard>
      </Container>
    </FAQSection>
  );
};

export default FAQ; 