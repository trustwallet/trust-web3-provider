export interface ITonProviderConfig {
  isTrust?: boolean;
  disableMobileAdapter?: boolean;
  version?: string;
}

export default interface ITonProvider {
  isConnected(): Promise<boolean>;
  send(method: string, params?: unknown[] | object): Promise<unknown>;
}
