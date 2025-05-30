import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(250, 117, 23, 0.1);
`;

const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
`;

const LogoSection = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  group: hover;
`;

const LogoImage = styled(motion.img)`
  width: 2.5rem;
  height: 2.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #fa7517, #ff8c3a);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  ${LogoSection}:hover &::before {
    opacity: 0.3;
  }
`;

const LogoText = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fa7517, #ff8c3a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const NavLink = styled(Link)`
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    color: #ff8c3a;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #fa7517, #ff8c3a);
    transition: width 0.3s ease;
  }
  
  &:hover::after {
    width: 100%;
  }
`;

const CTAButton = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #fa7517 0%, #ea580c 100%);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px -5px rgba(250, 117, 23, 0.4);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 35px -5px rgba(250, 117, 23, 0.5);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
`;

const MobileMenuButton = styled(motion.button)`
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const MenuLine = styled.div<{ isOpen: boolean }>`
  width: 20px;
  height: 2px;
  background: #ff8c3a;
  transition: all 0.3s ease;
  
  &:nth-child(1) {
    transform: ${props => props.isOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'};
  }
  
  &:nth-child(2) {
    opacity: ${props => props.isOpen ? '0' : '1'};
  }
  
  &:nth-child(3) {
    transform: ${props => props.isOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'};
  }
`;

const MobileMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(250, 117, 23, 0.1);
  padding: 2rem;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const LandingPageHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleGetStarted = () => {
    // Scroll to hero section or navigate to sign up
    const heroSection = document.querySelector('#hero');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <LogoSection to="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogoImage 
              src="/assets/basetubelogo.png" 
              alt="Base.Tube Logo"
              whileHover={{ rotate: 5 }}
            />
          </motion.div>
          <LogoText>Base.Tube</LogoText>
        </LogoSection>

        <Navigation>
          <NavLink to="/discover" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
            Discover
          </NavLink>
          <NavLink to="/creator-hub" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
            Create
          </NavLink>
          <NavLink to="/faq" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
            FAQ
          </NavLink>
          
          <CTAButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
          >
            <Play className="w-4 h-4" />
            Get Started
            <ArrowRight className="w-4 h-4" />
          </CTAButton>

          <MobileMenuButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <MenuLine isOpen={isMobileMenuOpen} />
            <MenuLine isOpen={isMobileMenuOpen} />
            <MenuLine isOpen={isMobileMenuOpen} />
          </MobileMenuButton>
        </Navigation>
      </HeaderContent>

      {isMobileMenuOpen && (
        <MobileMenu
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <MobileNavLinks>
            <NavLink to="/discover" onClick={() => setIsMobileMenuOpen(false)}>
              Discover Passes
            </NavLink>
            <NavLink to="/creator-hub" onClick={() => setIsMobileMenuOpen(false)}>
              Creator Hub
            </NavLink>
            <NavLink to="/faq" onClick={() => setIsMobileMenuOpen(false)}>
              FAQ
            </NavLink>
          </MobileNavLinks>
        </MobileMenu>
      )}
    </HeaderContainer>
  );
};

export default LandingPageHeader; 