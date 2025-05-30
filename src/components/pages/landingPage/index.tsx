import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import LandingPageHeader from './Header';
import Hero from './Hero';
import Feature from './Feature';
import HowTo from './HowTo';
import Testimonial from './Testimonial';
import FAQ from './FAQ';
import Footer from './Footer';

const LandingPageContainer = styled.div`
  min-height: 100vh;
  background: #000;
  color: white;
  overflow-x: hidden;
  position: relative;
  padding-top: 4rem; /* Account for fixed header */
`;

const ScrollProgressBar = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #fa7517, #ff8c3a);
  transform-origin: 0%;
  z-index: 100;
`;

const BackToTop = styled(motion.button)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #fa7517, #ea580c);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px -5px rgba(250, 117, 23, 0.4);
  z-index: 50;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px -5px rgba(250, 117, 23, 0.5);
  }
`;

const LandingPage: React.FC = () => {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / totalHeight;
      setScrollProgress(progress);
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LandingPageContainer>
      <LandingPageHeader />
      
      <ScrollProgressBar
        style={{ scaleX: scrollProgress }}
        transition={{ type: "spring", stiffness: 300 }}
      />
      
      <Hero />
      <Feature />
      <HowTo />
      <Testimonial />
      <FAQ />
      <Footer />
      
      {showBackToTop && (
        <BackToTop
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </BackToTop>
      )}
    </LandingPageContainer>
  );
};

export default LandingPage; 