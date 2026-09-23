export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  constructor(
    status: number,
    code: string,
    message: string,
    retryable = false,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}
export const unauthenticated = () =>
  new ApiError(401, 'unauthenticated', 'Sign in again to continue.');
export const unavailable = () =>
  new ApiError(
    503,
    'dependency_unavailable',
    'This service is temporarily unavailable. Try again.',
    true,
  );
export const timeout = () =>
  new ApiError(
    504,
    'timeout',
    'The request took too long. Check the current state before retrying.',
    true,
  );
export const invalidInput = () =>
  new ApiError(400, 'invalid_input', 'Check the request fields and try again.');
