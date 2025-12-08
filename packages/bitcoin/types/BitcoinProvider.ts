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

export default interface IBitcoinProvider {
  connect(): Promise<BtcAccount[]>;
  disconnect(): void;
  isConnected(): boolean;
  getNetwork(): string;
  requestAccounts(): Promise<BtcAccount[]>;
  signMessage(params: SignMessageParams): Promise<SignMessageResponse>;
  signPSBT(params: SignPSBTParams): Promise<string>;
  getAccounts(): BtcAccount[];
}
