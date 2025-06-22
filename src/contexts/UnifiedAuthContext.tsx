
import React, { createContext, useContext } from 'react';
import { useAuth as useSupabaseAuth } from './AuthContext';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { useBackendProvider } from './BackendProviderContext';

const UnifiedAuthContext = createContext<any>(undefined);

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { provider } = useBackendProvider();
  const supabaseAuth = useSupabaseAuth();
  const firebaseAuth = useFirebaseAuth();

  const currentAuth = provider === 'supabase' ? supabaseAuth : firebaseAuth;

  return (
    <UnifiedAuthContext.Provider value={currentAuth}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};
