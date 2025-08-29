import { createContext, useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';

interface AnimationContextType {
  drawerProgress: SharedValue<number>;
}

export const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
