export type MediaResolverErrorCode =
  | 'UNSUPPORTED_PROVIDER'
  | 'RESOLUTION_FAILED';

export class MediaResolverError extends Error {
  constructor(
    public readonly code: MediaResolverErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MediaResolverError';
  }
}

