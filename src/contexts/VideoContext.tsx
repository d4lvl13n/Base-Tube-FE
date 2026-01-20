import React, { createContext, useState, useContext } from 'react';

interface VideoContextType {
  isCommentsPanelOpen: boolean;
  setIsCommentsPanelOpen: (open: boolean) => void;
  isInfoPanelOpen: boolean;
  setIsInfoPanelOpen: (open: boolean) => void;
}

export const VideoContext = createContext<VideoContextType>({
  isCommentsPanelOpen: false,
  setIsCommentsPanelOpen: () => {},
  isInfoPanelOpen: false,
  setIsInfoPanelOpen: () => {},
});

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  return (
    <VideoContext.Provider value={{
      isCommentsPanelOpen,
      setIsCommentsPanelOpen,
      isInfoPanelOpen,
      setIsInfoPanelOpen
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => useContext(VideoContext);