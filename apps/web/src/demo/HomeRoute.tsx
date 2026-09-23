import Home from './legacy/views/Home';
import { useDemoNavigation } from './useDemoNavigation';

export default function HomeRoute() {
  const onNav = useDemoNavigation();
  return (
    <section aria-label="Sample overview">
      <h1 className="page-title">Demo overview</h1>
      <Home onNav={onNav} />
    </section>
  );
}
