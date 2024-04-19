export interface TrustEvent {
  connect(...args: unknown[]): unknown;
  disconnect(...args: unknown[]): unknown;
  accountChanged(...args: unknown[]): unknown;
}

export interface TrustEventEmitter {
  on<E extends keyof TrustEvent>(
    event: E,
    listener: TrustEvent[E],
    context?: any,
  ): void;
  off<E extends keyof TrustEvent>(
    event: E,
    listener: TrustEvent[E],
    context?: any,
  ): void;
}
