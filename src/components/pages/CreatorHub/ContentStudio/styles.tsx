import { motion } from 'framer-motion';
import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  padding-top: 4rem;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
`;

export const Title = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

export const SelectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #fa7517;
  color: #ffffff;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: #ff8c3a;
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #4b5563;
    cursor: not-allowed;
    transform: none;
  }
`;

export const DragDropZone = styled.div`
  border: 2px dashed #374151;
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(55, 65, 81, 0.1);
  margin: 2rem 0;

  &:hover {
    border-color: #fa7517;
    background: rgba(250, 117, 23, 0.1);
  }
`;

export const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

export const StatBox = styled.div`
  background: rgba(55, 65, 81, 0.3);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const UploadButton = styled.button<{ isUploading: boolean }>`
  width: 100%;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: ${({ isUploading }) => (isUploading ? '#ffffff' : '#000000')};
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
  background: ${({ isUploading }) => 
    isUploading 
      ? 'linear-gradient(45deg, #4b5563, #374151)'
      : 'linear-gradient(45deg, #fa7517, #ff8c3a)'};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

export const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const FileItem = styled.div`
  background: rgba(55, 65, 81, 0.3);
  border-radius: 0.75rem;
  overflow: hidden;
`;

export const FileDetails = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const FileName = styled.div`
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

export const FileProgress = styled.span`
  font-size: 0.875rem;
  color: #9ca3af;
`;

export const StatusIcon = styled.div<{ status: string }>`
  color: ${({ status }) => 
    status === 'completed' ? '#10b981' : 
    status === 'failed' ? '#ef4444' : 
    '#9ca3af'};
`;

export const FileStatus = styled.span<{ status: string }>`
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background: ${({ status }) => 
    status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 
    status === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 
    'rgba(156, 163, 175, 0.1)'};
  color: ${({ status }) => 
    status === 'completed' ? '#10b981' : 
    status === 'failed' ? '#ef4444' : 
    '#9ca3af'};
`;

export const ProgressBar = styled.div<{ progress: number; status: string }>`
  height: 4px;
  background: #374151;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ progress }) => progress}%;
    background: ${({ status }) => 
      status === 'completed' ? '#10b981' : 
      status === 'failed' ? '#ef4444' : 
      '#fa7517'};
    transition: width 0.3s ease;
  }
`;

export const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: 0.75rem;
`;

export const InfoCard = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(250, 117, 23, 0.1);
`;

export const SuccessCard = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  backdrop-filter: blur(8px);
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  z-index: 50;
`;

export const styles = {
  container: `
    p-8 max-w-7xl mx-auto space-y-8
  `,
  header: {
    wrapper: `
      bg-black/50 rounded-2xl p-6 border border-gray-800/50 
      backdrop-blur-sm relative overflow-hidden mb-8
    `,
    title: "text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fa7517] to-orange-400",
    subtitle: "text-gray-400 mt-2",
  },
  uploadCard: {
    wrapper: `
      bg-black/50 rounded-2xl border border-gray-800/50 
      backdrop-blur-sm relative overflow-hidden
      transition-all duration-300
      hover:border-[#fa7517]/50
    `,
    header: "p-6 border-b border-gray-800/30",
    content: "p-6 space-y-4",
  },
  progressCard: {
    wrapper: `
      bg-black/50 rounded-xl border border-gray-800/50 
      backdrop-blur-sm relative overflow-hidden p-4
      transition-all duration-300
    `,
    header: "flex items-center justify-between mb-3",
    title: "text-sm font-medium text-white truncate",
    progress: {
      wrapper: "relative pt-1",
      bar: "overflow-hidden h-2 text-xs flex rounded-full bg-gray-800/50",
      fill: "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#fa7517]",
      text: "text-xs text-gray-400 mt-1",
    },
  },
  successCard: {
    wrapper: `
      bg-black/50 rounded-xl border border-green-500/20 
      backdrop-blur-sm relative overflow-hidden p-4
      transition-all duration-300
      animate-fadeIn
    `,
    header: "flex items-center gap-2 text-green-400 mb-2",
    title: "font-medium",
    content: "text-sm text-gray-400",
  },
  errorCard: {
    wrapper: `
      bg-black/50 rounded-xl border border-red-500/20 
      backdrop-blur-sm relative overflow-hidden p-4
      transition-all duration-300
    `,
    header: "flex items-center gap-2 text-red-400 mb-2",
    title: "font-medium",
    content: "text-sm text-gray-400",
  },
  dropzone: {
    active: `
      border-[#fa7517] bg-[#fa7517]/5
      border-2 border-dashed rounded-xl p-8
      transition-all duration-300
    `,
    inactive: `
      border-gray-800/50 hover:border-[#fa7517]/50
      border-2 border-dashed rounded-xl p-8
      transition-all duration-300
    `,
    text: "text-center text-gray-400",
  },
  // Animation for success card
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0', transform: 'translateY(10px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' }
    }
  },
  animation: {
    fadeIn: 'fadeIn 0.5s ease-out forwards'
  }
} as const;
