import React, { useEffect, useState } from 'react';
import useDbStore from '../store/dbStore';
import useModelStore from '../store/modelStore';

interface LoadingGateProps {
  children: React.ReactNode;
  onInitialized: () => void;
}

const LoadingGate: React.FC<LoadingGateProps> = ({ children, onInitialized }) => {
  const { isInitialized: isDbInitialized } = useDbStore();
  const { isInitialized: isModelInitialized } = useModelStore();
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  useEffect(() => {
    if (isDbInitialized && isModelInitialized && !isAppInitialized) {
      setIsAppInitialized(true);
      onInitialized();
    }
  }, [isDbInitialized, isModelInitialized, isAppInitialized, onInitialized]);

  return isAppInitialized ? <>{children}</> : null;
};

export default LoadingGate;
