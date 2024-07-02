export interface IAptosProviderConfig {
  isTrust?: boolean;
  network?: string;
}

export default interface IAptosProvider {}

export interface ISignMessagePayload {
  address: string;
  application: string;
  message: string;
  nonce: string;
  chainId: string;
}
