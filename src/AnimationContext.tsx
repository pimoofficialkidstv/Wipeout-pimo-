import React, { createContext, useContext } from 'react';

interface AnimationContextType {
  ios27Animations: boolean;
  currentTransition: any;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider: React.FC<{ 
  children: React.ReactNode, 
  ios27Animations: boolean, 
  currentTransition: any 
}> = ({ children, ios27Animations, currentTransition }) => {
  return (
    <AnimationContext.Provider value={{ ios27Animations, currentTransition }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
