import { useNavigate } from 'react-router-dom';

const destinations: Record<string, string> = {
  home: '/demo/home',
  portfolio: '/demo/portfolio',
  discover: '/demo/funds',
  plan: '/demo/plan',
};

export function useDemoNavigation() {
  const navigate = useNavigate();
  return (destination: string) => {
    const path = destinations[destination];
    if (!path) throw new Error('Unknown demo destination.');
    void navigate(path);
  };
}
