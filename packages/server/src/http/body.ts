import { ApiError, invalidInput, timeout } from '../errors.ts';

export async function jsonBody(
  request: Request,
  signal: AbortSignal,
): Promise<unknown> {
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/json'
  ) {
    throw new ApiError(
      415,
      'unsupported_media_type',
      'Send an application/json request.',
    );
  }
  const reader = request.body?.getReader();
  if (!reader) return {};
  const cancel = () => {
    void reader.cancel();
  };
  signal.addEventListener('abort', cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      if (signal.aborted) throw timeout();
      const chunk = await reader.read();
      if (signal.aborted) throw timeout();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        throw new ApiError(
          413,
          'payload_too_large',
          'The request exceeds the 4 KiB limit.',
        );
      }
      chunks.push(chunk.value);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    } catch {
      throw invalidInput();
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}
