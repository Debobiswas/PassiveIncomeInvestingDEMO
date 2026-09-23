import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { RouteError } from './RouteError';
import { Landing, NotFound } from './pages';

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
      {
        lazy: async () => ({
          Component: (await import('../features/auth/AuthLayout')).AuthLayout,
        }),
        children: [
          {
            path: 'login',
            lazy: async () => ({
              Component: (await import('../features/auth/Login')).Login,
            }),
          },
          {
            path: 'auth/callback',
            lazy: async () => ({
              Component: (await import('../features/auth/Callback')).Callback,
            }),
          },
          {
            path: 'auth/recovery',
            lazy: async () => ({
              Component: (await import('../features/auth/Recovery')).Recovery,
            }),
          },
          {
            path: 'app',
            lazy: async () => ({
              Component: (await import('../features/identity/MemberLayout'))
                .MemberLayout,
            }),
            children: [
              { index: true, element: <Navigate to="home" replace /> },
              {
                path: 'home',
                lazy: async () => ({
                  Component: (await import('../features/identity/MemberHome'))
                    .MemberHome,
                }),
              },
              {
                path: 'onboarding',
                lazy: async () => ({
                  Component: (await import('../features/identity/Onboarding'))
                    .Onboarding,
                }),
              },
              { path: '*', element: <NotFound /> },
            ],
          },
        ],
      },
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
