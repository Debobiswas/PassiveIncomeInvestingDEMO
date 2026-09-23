import Plan from './legacy/views/Plan';
import { useDemoNavigation } from './useDemoNavigation';

export default function PlanRoute() {
  const onNav = useDemoNavigation();
  return (
    <section aria-label="Sample plan">
      <h1 className="page-title">Demo income plan</h1>
      <Plan onNav={onNav} />
    </section>
  );
}
