
export interface ISolanaProviderConfig {
  isOnto?: boolean;
  enableAdapter?: boolean;
  cluster?: string;
  disableMobileAdapter?: boolean;
}

export interface ConnectOptions {
  onlyIfTrusted?: boolean | undefined;
}
