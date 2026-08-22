import { createContext, useContext } from 'react';

export const PortfolioContext = createContext(null);

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used inside <DemoProvider> or <LiveProvider>');
  }
  return ctx;
}
