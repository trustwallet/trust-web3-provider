export interface IBitcoinProviderConfig {
  // Config can be extended in the future if needed
}

export interface BtcAccount {
  address: string;
  publicKey: string;
}

export interface SignMessageParams {
  message: string | Buffer | Uint8Array;
  address: string;
}

export interface SignMessageResponse {
  signature: Uint8Array;
}

export interface SignPSBTOptions {
  autoFinalized?: boolean;
}

export interface SignPSBTParams {
  psbtHex: string;
  options?: SignPSBTOptions;
}

export interface PushPSBTParams {
  psbtHex: string;
}

export interface PushPSBTResponse {
  txid: string;
}

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
  emit(event: string, ...args: any[]): boolean;
}

export default interface IBitcoinProvider extends TrustBitcoinEventEmitter {
  connect(): Promise<BtcAccount[]>;
  disconnect(): void;
  isConnected(): boolean;
  getNetwork(): string;
  requestAccounts(): Promise<BtcAccount[]>;
  signMessage(params: SignMessageParams): Promise<SignMessageResponse>;
  signPSBT(params: SignPSBTParams): Promise<string>;
  pushPSBT(params: PushPSBTParams): Promise<PushPSBTResponse>;
  getAccounts(): BtcAccount[];
}
