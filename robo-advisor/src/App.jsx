import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionProvider';
import DemoProvider from './context/DemoProvider';
import LiveProvider from './context/LiveProvider';
import PortalLayout from './components/layout/PortalLayout';
import RequireAuth from './components/auth/RequireAuth';

const Home         = lazy(() => import('./views/Home'));
const Portfolio    = lazy(() => import('./views/Portfolio'));
const Discover     = lazy(() => import('./views/Discover'));
const Plan         = lazy(() => import('./views/Plan'));
const Landing      = lazy(() => import('./views/Landing'));
const Login        = lazy(() => import('./views/Login'));
const AuthCallback = lazy(() => import('./views/AuthCallback'));

function Loading() {
  return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-low)' }}>
      <div className="text-sm">Loading…</div>
    </div>
  );
}

// The same four views are mounted under both portals. Only the surrounding
// data provider differs, which is why no view needs to know its portal.
function portalRoutes() {
  return (
    <>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home"      element={<Home />} />
      <Route path="portfolio" element={<Portfolio />} />
      <Route path="discover"  element={<Discover />} />
      <Route path="plan"      element={<Plan />} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route path="/demo" element={<DemoProvider><PortalLayout mode="demo" /></DemoProvider>}>
              {portalRoutes()}
            </Route>

            <Route path="/app" element={
              <RequireAuth><LiveProvider><PortalLayout mode="app" /></LiveProvider></RequireAuth>
            }>
              {portalRoutes()}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SessionProvider>
    </BrowserRouter>
  );
}
