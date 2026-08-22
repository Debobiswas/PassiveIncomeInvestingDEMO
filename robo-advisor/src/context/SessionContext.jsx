import { createContext, useContext } from 'react';

// Mirrors PortfolioContext.jsx: this file exports the context object and the
// hook only, no components. eslint-plugin-react-refresh's
// only-export-components rule rejects a file that exports both, so the
// <SessionProvider> component lives in ./SessionProvider.jsx.
export const SessionContext = createContext(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
