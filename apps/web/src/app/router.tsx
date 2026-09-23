import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { RouteError } from './RouteError';
import { Landing, MemberUnavailable, NotFound } from './pages';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: (
      <main className="site-main">
        <p role="status">Loading page…</p>
      </main>
    ),
    children: [
      { index: true, element: <Landing /> },
      { path: 'app/*', element: <MemberUnavailable /> },
      { path: 'login', element: <MemberUnavailable /> },
      {
        path: 'demo',
        lazy: async () => ({
          Component: (await import('../demo/DemoLayout')).DemoLayout,
        }),
        children: [
          { index: true, element: <Navigate to="home" replace /> },
          {
            path: 'home',
            lazy: async () => ({
              Component: (await import('../demo/HomeRoute')).default,
            }),
          },
          {
            path: 'portfolio',
            lazy: async () => ({
              Component: (await import('../demo/PortfolioRoute')).default,
            }),
          },
          {
            path: 'funds',
            lazy: async () => ({
              Component: (await import('../demo/FundsRoute')).default,
            }),
          },
          {
            path: 'plan',
            lazy: async () => ({
              Component: (await import('../demo/PlanRoute')).default,
            }),
          },
          { path: 'discover', element: <Navigate to="../funds" replace /> },
          { path: '*', element: <NotFound /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
