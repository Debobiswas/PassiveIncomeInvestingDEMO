import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import {
  createIdentityHandler,
  createReadinessHandler,
  liveness,
} from '@pii/server';

export function applicationHandler() {
  const identity = createIdentityHandler();
  const readiness = createReadinessHandler();
  return (request: Request) => {
    const path = new URL(request.url).pathname;
    if (path === '/api/health') return liveness(request);
    if (path === '/api/ready') return readiness(request);
    return identity(request);
  };
}

// This adapter exercises the same Web Request handler used by Vercel, over HTTP.
export function apiServer(handler: (request: Request) => Promise<Response>) {
  return createServer(async (incoming, outgoing) => {
    const controller = new AbortController();
    incoming.on('aborted', () => controller.abort());
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (value !== undefined)
          headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      const body =
        incoming.method === 'GET' || incoming.method === 'HEAD'
          ? undefined
          : (Readable.toWeb(incoming) as ReadableStream<Uint8Array>);
      const init: RequestInit & { duplex: 'half' } = {
        method: incoming.method ?? 'GET',
        headers,
        duplex: 'half',
        signal: controller.signal,
        ...(body ? { body } : {}),
      };
      const response = await handler(
        new Request(
          `http://${incoming.headers.host ?? '127.0.0.1'}${incoming.url ?? '/'}`,
          init,
        ),
      );
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      outgoing.writeHead(500, { 'Cache-Control': 'no-store' });
      outgoing.end();
    }
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  apiServer(applicationHandler()).listen(3001, '127.0.0.1', () =>
    console.log('PII API: http://127.0.0.1:3001'),
  );
}
