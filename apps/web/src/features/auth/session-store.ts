import type { Session } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';
import { sessionMarker } from './policy';

export type AuthState = {
  status: 'loading' | 'ready' | 'error';
  session: Session | null;
  recovery: boolean;
  epoch: number;
  notice: string;
};

// Synchronous identity changes hide old views and cancel/clear all private cache.
// Epochs also separate two different sessions belonging to the same account.
export class SessionStore {
  private state: AuthState = {
    status: 'loading',
    session: null,
    recovery: false,
    epoch: 0,
    notice: '',
  };
  private listeners = new Set<() => void>();
  constructor(private queries: QueryClient) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  set(session: Session | null, recovery = false, notice = '') {
    const changed =
      this.state.session?.user.id !== session?.user.id ||
      sessionMarker(this.state.session?.access_token) !==
        sessionMarker(session?.access_token) ||
      recovery !== this.state.recovery;
    if (changed || !session) {
      void this.queries.cancelQueries();
      this.queries.clear();
    }
    this.state = {
      status: 'ready',
      session,
      recovery,
      notice,
      epoch: this.state.epoch + (changed ? 1 : 0),
    };
    this.listeners.forEach((listener) => listener());
  }
  fail() {
    void this.queries.cancelQueries();
    this.queries.clear();
    this.state = {
      status: 'error',
      session: null,
      recovery: false,
      notice: 'We couldn’t restore your session. Please retry.',
      epoch: this.state.epoch + 1,
    };
    this.listeners.forEach((listener) => listener());
  }
}
