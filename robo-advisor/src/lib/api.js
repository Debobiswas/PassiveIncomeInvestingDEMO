import { supabase } from './supabase';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return { Authorization: `Bearer ${token}` };
}

async function handle(res) {
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export async function apiGet(path) {
  return handle(await fetch(path, { headers: await authHeaders() }));
}

export async function apiPost(path, body = {}) {
  return handle(await fetch(path, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

export async function apiDelete(path) {
  return handle(await fetch(path, { method: 'DELETE', headers: await authHeaders() }));
}

export async function apiUpload(path, file) {
  const form = new FormData();
  form.append('file', file);
  // Content-Type is deliberately omitted so the browser sets the
  // multipart boundary itself.
  return handle(await fetch(path, { method: 'POST', headers: await authHeaders(), body: form }));
}
