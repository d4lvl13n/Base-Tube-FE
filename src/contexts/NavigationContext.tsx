import React, { createContext, useContext, useState, useEffect } from 'react';

type NavStyle = 'classic' | 'floating';

interface NavigationContextType {
  navStyle: NavStyle;
  setNavStyle: (style: NavStyle) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navStyle, setNavStyle] = useState<NavStyle>(() => {
    const saved = localStorage.getItem('navStyle');
    return (saved as NavStyle) || 'classic';
  });

  useEffect(() => {
    localStorage.setItem('navStyle', navStyle);
  }, [navStyle]);

  return (
    <NavigationContext.Provider value={{ navStyle, setNavStyle }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}; 