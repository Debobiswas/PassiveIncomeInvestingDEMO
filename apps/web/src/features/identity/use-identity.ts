import { useOutletContext } from 'react-router-dom';
import type { loadIdentity } from './client';

export type Identity = Awaited<ReturnType<typeof loadIdentity>>;
export function useIdentity() {
  return useOutletContext<{
    identity: Identity;
    reload: () => Promise<unknown>;
  }>();
}
