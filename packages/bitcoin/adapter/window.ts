export interface TrustBitcoinEvent {
  connect(...args: unknown[]): unknown;
  disconnect(...args: unknown[]): unknown;
  accountsChanged(...args: unknown[]): unknown;
}

export interface TrustBitcoinEventEmitter {
  on<E extends keyof TrustBitcoinEvent>(
    event: E,
    listener: TrustBitcoinEvent[E],
    context?: any,
  ): void;
  off<E extends keyof TrustBitcoinEvent>(
    event: E,
    listener: TrustBitcoinEvent[E],
    context?: any,
  ): void;
}
