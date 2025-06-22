
import React, { createContext, useContext, useState } from 'react';

type BackendProvider = 'supabase' | 'firebase';

interface BackendProviderContextType {
  provider: BackendProvider;
  setProvider: (provider: BackendProvider) => void;
}

const BackendProviderContext = createContext<BackendProviderContextType | undefined>(undefined);

export const useBackendProvider = () => {
  const context = useContext(BackendProviderContext);
  if (context === undefined) {
    throw new Error('useBackendProvider must be used within a BackendProviderProvider');
  }
  return context;
};

export const BackendProviderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<BackendProvider>('supabase');

  return (
    <BackendProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </BackendProviderContext.Provider>
  );
};
