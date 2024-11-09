import React, { createContext, useState, useContext } from 'react';

interface VideoContextType {
  isCommentsPanelOpen: boolean;
  setIsCommentsPanelOpen: (open: boolean) => void;
}

export const VideoContext = createContext<VideoContextType>({
  isCommentsPanelOpen: false,
  setIsCommentsPanelOpen: () => {},
});

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);

  return (
    <VideoContext.Provider value={{ isCommentsPanelOpen, setIsCommentsPanelOpen }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => useContext(VideoContext);