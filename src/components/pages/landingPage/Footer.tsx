import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { 
  Twitter, 
  Github, 
  Linkedin, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  Heart,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FooterSection = styled.footer`
  position: relative;
  background: #000;
  border-top: 1px solid rgba(250, 117, 23, 0.2);
  overflow: hidden;
`;

const FooterGradient = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(250, 117, 23, 0.6), transparent);
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 4rem 2rem 2rem;
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
`;

const BrandSection = styled.div``;

const Logo = styled(motion.div)`
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ff8c3a 0%, #fa7517 50%, #ea580c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 1rem;
  display: inline-block;
`;

const BrandDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  max-width: 350px;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
`;

const SocialLink = styled(motion.a)`
  width: 40px;
  height: 40px;
  background: rgba(250, 117, 23, 0.1);
  border: 1px solid rgba(250, 117, 23, 0.2);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff8c3a;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(250, 117, 23, 0.2);
    border-color: rgba(250, 117, 23, 0.4);
    transform: translateY(-2px);
    color: #ffffff;
  }
`;

const FooterColumn = styled.div``;

const ColumnTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1.5rem;
`;

const FooterLinks = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FooterLinkItem = styled.li`
  margin-bottom: 0.75rem;
`;

const FooterLink = styled(Link)`
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.3s ease;
  
  &:hover {
    color: #ff8c3a;
    transform: translateX(5px);
  }
`;

const ExternalLink = styled.a`
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.3s ease;
  
  &:hover {
    color: #ff8c3a;
    transform: translateX(5px);
    
    svg {
      opacity: 1;
    }
  }
  
  svg {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  
  svg {
    color: #ff8c3a;
  }
`;

const FooterBottom = styled.div`
  padding-top: 2rem;
  border-top: 1px solid rgba(250, 117, 23, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const Copyright = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LegalLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const LegalLink = styled(Link)`
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: #ff8c3a;
  }
`;

const NewsletterSection = styled(motion.div)`
  background: linear-gradient(135deg, rgba(250, 117, 23, 0.1) 0%, rgba(20, 20, 20, 0.6) 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 3rem;
  border: 1px solid rgba(250, 117, 23, 0.2);
`;

const NewsletterTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const NewsletterDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
`;

const NewsletterForm = styled.form`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const EmailInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(250, 117, 23, 0.3);
  border-radius: 0.75rem;
  color: white;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(250, 117, 23, 0.6);
  }
`;

const SubscribeButton = styled(motion.button)`
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #fa7517 0%, #ea580c 100%);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px -5px rgba(250, 117, 23, 0.4);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 35px -5px rgba(250, 117, 23, 0.5);
  }
`;

const Footer: React.FC = () => {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter submission
  };

  return (
    <FooterSection>
      <FooterGradient />
      
      <Container>
        <NewsletterSection
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <NewsletterTitle>Stay in the Loop</NewsletterTitle>
          <NewsletterDescription>
            Get the latest updates on new features and creator success stories
          </NewsletterDescription>
          <NewsletterForm onSubmit={handleNewsletterSubmit}>
            <EmailInput 
              type="email" 
              placeholder="Enter your email" 
              required 
            />
            <SubscribeButton
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Subscribe
            </SubscribeButton>
          </NewsletterForm>
        </NewsletterSection>
        
        <FooterContent>
          <BrandSection>
            <Logo
              whileHover={{ scale: 1.05 }}
            >
              Base.Tube
            </Logo>
            <BrandDescription>
              Empowering creators to monetize their content through exclusive 
              pass-based access. Build your community, grow your revenue.
            </BrandDescription>
            <SocialLinks>
              <SocialLink 
                href="https://twitter.com" 
                target="_blank"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Twitter className="w-5 h-5" />
              </SocialLink>
              <SocialLink 
                href="https://github.com" 
                target="_blank"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="w-5 h-5" />
              </SocialLink>
              <SocialLink 
                href="https://linkedin.com" 
                target="_blank"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Linkedin className="w-5 h-5" />
              </SocialLink>
              <SocialLink 
                href="https://youtube.com" 
                target="_blank"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Youtube className="w-5 h-5" />
              </SocialLink>
            </SocialLinks>
          </BrandSection>
          
          <FooterColumn>
            <ColumnTitle>Product</ColumnTitle>
            <FooterLinks>
              <FooterLinkItem>
                <FooterLink to="/features">Features</FooterLink>
              </FooterLinkItem>
              <FooterLinkItem>
                <FooterLink to="/pricing">Pricing</FooterLink>
              </FooterLinkItem>
              <FooterLinkItem>
                <FooterLink to="/creator-hub">Creator Hub</FooterLink>
              </FooterLinkItem>
              <FooterLinkItem>
                <FooterLink to="/discover">Discover</FooterLink>
              </FooterLinkItem>
              <FooterLinkItem>
                <ExternalLink href="https://docs.base.tube" target="_blank">
                  Documentation
                  <ArrowUpRight className="w-3 h-3" />
                </ExternalLink>
              </FooterLinkItem>
            </FooterLinks>
          </FooterColumn>
          
          <FooterColumn>
            <ColumnTitle>Company</ColumnTitle>
            <FooterLinks>
              <FooterLinkItem>
                <FooterLink to="/about">About Us</FooterLink>
              </FooterLinkItem>
              <FooterLinkItem>
                <FooterLink to="/blog">Blog</FooterLink>
              </FooterLinkItem>
              <FooterLinkItem>
                <FooterLink to="/careers">Careers</FooterLink>
              </FooterLinkItem>
              <FooterLinkItem>
                <FooterLink to="/contact">Contact</FooterLink>
              </FooterLinkItem>
              <FooterLinkItem>
                <FooterLink to="/press">Press Kit</FooterLink>
              </FooterLinkItem>
            </FooterLinks>
          </FooterColumn>
          
          <FooterColumn>
            <ColumnTitle>Get in Touch</ColumnTitle>
            <ContactInfo>
              <Mail className="w-4 h-4" />
              <span>support@base.tube</span>
            </ContactInfo>
            <ContactInfo>
              <Phone className="w-4 h-4" />
              <span>+1 (555) 123-4567</span>
            </ContactInfo>
            <ContactInfo>
              <MapPin className="w-4 h-4" />
              <span>San Francisco, CA</span>
            </ContactInfo>
          </FooterColumn>
        </FooterContent>
        
        <FooterBottom>
          <Copyright>
            © 2024 Base.Tube. Made with <Heart className="w-4 h-4 text-orange-400" fill="currentColor" /> for creators
          </Copyright>
          <LegalLinks>
            <LegalLink to="/privacy">Privacy Policy</LegalLink>
            <LegalLink to="/terms">Terms of Service</LegalLink>
            <LegalLink to="/cookies">Cookie Policy</LegalLink>
          </LegalLinks>
        </FooterBottom>
      </Container>
    </FooterSection>
  );
};

export default Footer; 