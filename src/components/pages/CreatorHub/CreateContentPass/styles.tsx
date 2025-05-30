import styled from 'styled-components';
import { motion } from 'framer-motion';

export const Container = styled(motion.div)`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  
  @media (min-width: 768px) {
    margin-bottom: 3rem;
  }
`;

export const Title = styled.h1`
  background: linear-gradient(to right, #fa7517, #ff8c3a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  
  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

export const SubTitle = styled.p`
  color: #adadad;
  font-size: 1rem;
  max-width: 800px;
  margin: 0 auto;
  
  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

export const FormContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
  
  @media (min-width: 768px) {
    gap: 2rem;
    padding: 2.5rem;
    margin-bottom: 2rem;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, #fa7517, #ff8c3a);
    opacity: 0.8;
  }
`;

export const StepIndicatorContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-50%);
    z-index: 0;
  }
`;

export const StepDot = styled.div<{ active?: boolean, completed?: boolean }>`
  width: ${props => props.active ? '3rem' : '2.5rem'};
  height: ${props => props.active ? '3rem' : '2.5rem'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.completed 
    ? 'linear-gradient(to right, #fa7517, #ff8c3a)' 
    : props.active 
      ? 'rgba(250, 117, 23, 0.2)' 
      : 'rgba(0, 0, 0, 0.3)'};
  border: 2px solid ${props => props.active || props.completed ? '#fa7517' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.completed ? 'black' : props.active ? '#fa7517' : '#adadad'};
  font-weight: ${props => props.active || props.completed ? 'bold' : 'normal'};
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  box-shadow: ${props => props.active ? '0 0 15px rgba(250, 117, 23, 0.3)' : 'none'};
  transform: ${props => props.active ? 'scale(1.1)' : 'scale(1)'};
`;

export const StepLabel = styled.span<{ active?: boolean }>`
  position: absolute;
  top: 100%;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: ${props => props.active ? '#fa7517' : '#adadad'};
  font-weight: ${props => props.active ? 'medium' : 'normal'};
  white-space: nowrap;
`;

export const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

export const Label = styled.label`
  display: block;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #f0f0f0;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 30, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #fa7517;
    box-shadow: 0 0 0 2px rgba(250, 117, 23, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 30, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #fa7517;
    box-shadow: 0 0 0 2px rgba(250, 117, 23, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(30, 30, 30, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;

  &:focus {
    outline: none;
    border-color: #fa7517;
    box-shadow: 0 0 0 2px rgba(250, 117, 23, 0.2);
  }
`;

export const OptionGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const TierOption = styled.button<{ selected: boolean }>`
  padding: 1.5rem 1rem;
  border-radius: 0.75rem;
  background: ${props => props.selected ? 'rgba(250, 117, 23, 0.15)' : 'rgba(30, 30, 30, 0.5)'};
  border: 2px solid ${props => props.selected ? '#fa7517' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.selected ? '#fa7517' : 'white'};
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.selected ? 'rgba(250, 117, 23, 0.2)' : 'rgba(50, 50, 50, 0.5)'};
    transform: translateY(-2px);
  }
`;

export const TierBadge = styled.div<{ tier?: string }>`
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin: 0 auto 0.75rem;
  max-width: fit-content;
  
  background: ${props => {
    const tierValue = props.tier?.toLowerCase() || 'bronze';
    switch(tierValue) {
      case 'bronze': return 'linear-gradient(to right, #cd7f32, #b36a24)';
      case 'silver': return 'linear-gradient(to right, #c0c0c0, #a0a0a0)';
      case 'gold': return 'linear-gradient(to right, #ffd700, #f0c000)';
      default: return 'linear-gradient(to right, #cd7f32, #b36a24)';
    }
  }};
  
  color: ${props => (props.tier?.toLowerCase() || 'bronze') === 'gold' ? 'black' : 'white'};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

export const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

export const InputPrefix = styled.div`
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: rgba(50, 50, 50, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem 0 0 0.5rem;
  color: #adadad;
  font-weight: bold;
`;

export const InputWithPrefix = styled(Input)`
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
`;

export const NavigationContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  
  @media (min-width: 768px) {
    flex-wrap: nowrap;
    margin-top: 2rem;
  }
`;

export const Button = styled(motion.button)<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  width: ${props => props.variant === 'primary' ? '100%' : 'auto'};
  
  @media (min-width: 768px) {
    width: auto;
    padding: 0.75rem 2rem;
    font-size: 1rem;
  }
  
  background: ${props => props.variant === 'primary' 
    ? 'linear-gradient(to right, #fa7517, #ff8c3a)' 
    : 'rgba(30, 30, 30, 0.5)'};
  
  color: ${props => props.variant === 'primary' ? 'black' : 'white'};
  
  border: 1px solid ${props => props.variant === 'primary' 
    ? 'transparent' 
    : 'rgba(255, 255, 255, 0.1)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.variant === 'primary' 
      ? '0 4px 20px rgba(250, 117, 23, 0.3)' 
      : '0 4px 20px rgba(0, 0, 0, 0.2)'};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const PreviewContainer = styled.div`
  background: rgba(20, 20, 20, 0.6);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const VideoPreview = styled.div`
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.5);
  position: relative;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ErrorText = styled.p`
  color: #ff5e5e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '⚠️';
    font-size: 0.75rem;
  }
`;

export const SuccessText = styled.p`
  color: #5eff8f;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

export const InfoBox = styled.div`
  background: rgba(250, 117, 23, 0.1);
  border: 1px solid rgba(250, 117, 23, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

export const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  line-height: 1.4;
  letter-spacing: 0.02em;
`;

export const Summary = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(20, 20, 20, 0.6);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

export const SummaryLabel = styled.span`
  color: #adadad;
`;

export const SummaryValue = styled.span`
  color: #ffffff;
  font-weight: 500;
`;

export const SummaryPrice = styled.span`
  color: #fa7517;
  font-weight: bold;
  font-size: 1.25rem;
`;

export const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ThreeColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 990px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
`;

export const Card = styled.div`
  background: rgba(20, 20, 20, 0.6);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  height: 100%;
`;

export const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #ffffff;
`;

export const LoaderOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

export const Spinner = styled(motion.div)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid rgba(250, 117, 23, 0.1);
  border-top-color: #fa7517;
  margin-bottom: 1rem;
`;

export const LoaderText = styled.p`
  color: white;
  font-size: 1.25rem;
  font-weight: medium;
`;

export const SuccessContainer = styled(motion.div)`
  text-align: center;
  padding: 2rem;
`;

export const SuccessIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  background: linear-gradient(to right, #fa7517, #ff8c3a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  color: black;
  font-size: 2rem;
`;

export const ShareContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 2rem;
  
  @media (min-width: 640px) {
    flex-wrap: nowrap;
    gap: 1rem;
  }
`;

export const ShareButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
  
  @media (min-width: 640px) {
    width: auto;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

// Button to remove a video URL entry inside dynamic field array
export const RemoveButton = styled.button`
  background: transparent;
  color: #ff5e5e;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: background 0.2s ease;
  &:hover {
    background: rgba(255, 94, 94, 0.1);
  }
`;

// Container for multiple video URL fields
export const VideoUrlContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

// Grid for video URL input and actions
export const VideoUrlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  > :first-child {
    flex: 1;
  }
`;

// Grid for video title input and label
export const VideoTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  background: rgba(250, 117, 23, 0.05);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 3px solid rgba(250, 117, 23, 0.3);
  
  > :first-child {
    flex: 1;
  }
`;

// Add video button with plus icon
export const AddVideoButton = styled(Button)`
  margin-bottom: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  gap: 0.5rem;
  
  svg {
    stroke-width: 3;
  }
`;

// Premium styled components for enhanced UI
export const PremiumInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 0.6rem;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #fa7517;
    box-shadow: 0 0 0 3px rgba(250, 117, 23, 0.2), 0 4px 12px rgba(0, 0, 0, 0.25);
    background: rgba(25, 25, 25, 0.7);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
`;

export const PremiumInputPrefix = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #fa7517;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

export const CurrencySelect = styled.div`
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.8rem;
    height: 0.8rem;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23fa7517'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: contain;
    pointer-events: none;
  }
`;

export const PremiumSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 0.6rem;
  color: white;
  font-size: 1rem;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #fa7517;
    box-shadow: 0 0 0 3px rgba(250, 117, 23, 0.2), 0 4px 12px rgba(0, 0, 0, 0.25);
    background: rgba(25, 25, 25, 0.7);
  }

  option {
    background: #1a1a1a;
    color: white;
    padding: 0.5rem;
  }
`;

// Premium Review step styled components
export const ReviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export const ReviewHeader = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;

export const ReviewTitle = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(to right, #fa7517, #ff8c3a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 0.5rem;
`;

export const ReviewSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
`;

export const ReviewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 990px) {
    grid-template-columns: 1fr;
  }
`;

export const ReviewCard = styled.div`
  background: rgba(15, 15, 15, 0.6);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(to right, #fa7517, #ff8c3a);
    opacity: 0.8;
  }
`;

export const ReviewCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
`;

export const ReviewCardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
`;

export const PassInfo = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

export const PassTitle = styled.h4`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: white;
`;

export const PassTierBadge = styled(TierBadge)`
  margin: 0 auto;
  padding: 0.3rem 1rem;
  font-size: 0.875rem;
`;

export const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 1.2rem 0;
`;

export const ReviewDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ReviewDetailIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(250, 117, 23, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fa7517;
  flex-shrink: 0;
`;

export const ReviewDetailContent = styled.div`
  flex: 1;
`;

export const ReviewDetailLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.2rem;
`;

export const ReviewDetailValue = styled.div<{ accent?: boolean }>`
  font-size: 1.125rem;
  font-weight: ${props => props.accent ? 'bold' : 'medium'};
  color: ${props => props.accent ? '#fa7517' : 'white'};
`;

export const VideosGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const VideoCard = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.75rem;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const VideoBadge = styled.div`
  position: absolute;
  top: 0.8rem;
  left: 0.8rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  z-index: 10;
`;

export const PremiumVideoPreview = styled.div`
  aspect-ratio: 16 / 9;
  overflow: hidden;
  position: relative;
`;

export const VideoUrl = styled.div`
  padding: 0.75rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

export const NoVideosMessage = styled.div`
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.5);
`;

export const SummaryCard = styled.div`
  background: linear-gradient(135deg, rgba(250, 117, 23, 0.15), rgba(255, 140, 58, 0.05));
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  border: 1px solid rgba(250, 117, 23, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
`;

export const SummaryStat = styled.div`
  flex: 1;
`;

export const SummaryStatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.3rem;
`;

export const SummaryStatLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`;

export const LaunchButton = styled(motion.button)`
  background: linear-gradient(to right, #fa7517, #ff8c3a);
  color: black;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(250, 117, 23, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 25px rgba(250, 117, 23, 0.4);
  }
`;

export const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

export const ModalContent = styled(motion.div)`
  background: #1a1a1a;
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

export const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
`;

export const ModalCloseButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s ease;

  &:hover {
    color: white;
  }
`;

export const ModalBody = styled.div`
  padding: 1.5rem;
  text-align: center;
`;

export const ConfirmIcon = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  
  /* Default warning style */
  background: rgba(255, 180, 0, 0.1);
  color: #ffb400;
  
  /* Celebration style */
  &.celebration {
    background: linear-gradient(135deg, rgba(250, 117, 23, 0.15), rgba(255, 140, 58, 0.05));
    color: #fa7517;
    box-shadow: 0 0 20px rgba(250, 117, 23, 0.2);
    
    /* Subtle shine animation */
    animation: shine 3s infinite;
    
    @keyframes shine {
      0% { box-shadow: 0 0 20px rgba(250, 117, 23, 0.2); }
      50% { box-shadow: 0 0 30px rgba(250, 117, 23, 0.4); }
      100% { box-shadow: 0 0 20px rgba(250, 117, 23, 0.2); }
    }
  }
`;

export const ConfirmFeatures = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 1.5rem 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const ConfirmFeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  
  svg {
    color: #fa7517;
    flex-shrink: 0;
  }
  
  strong {
    color: white;
    font-weight: 600;
  }
`;

export const ConfirmTitle = styled.h4`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: white;
`;

export const ConfirmText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
  line-height: 1.5;

  strong {
    color: white;
    font-weight: 600;
  }
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

export const ModalButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => props.variant === 'primary' 
    ? 'linear-gradient(to right, #fa7517, #ff8c3a)' 
    : 'rgba(30, 30, 30, 0.8)'};
  
  color: ${props => props.variant === 'primary' ? 'black' : 'white'};
  
  border: 1px solid ${props => props.variant === 'primary' 
    ? 'transparent' 
    : 'rgba(255, 255, 255, 0.1)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.variant === 'primary' 
      ? '0 4px 20px rgba(250, 117, 23, 0.3)' 
      : '0 4px 20px rgba(0, 0, 0, 0.2)'};
  }
`;

// Description content styled component for rich text
export const DescriptionContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  
  /* Basic rich text styling */
  h1, h2, h3, h4, h5, h6 {
    color: white;
    margin: 1rem 0 0.5rem;
  }
  
  p {
    margin-bottom: 0.75rem;
  }
  
  ul, ol {
    margin-left: 1.5rem;
    margin-bottom: 0.75rem;
  }
  
  a {
    color: #fa7517;
    text-decoration: underline;
  }
`;
