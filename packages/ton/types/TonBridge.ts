enum NETWORK {
  MAINNET = '-239',
  TESTNET = '-3',
}

type Feature =
  | { name: 'SendTransaction'; maxMessages: number } // `maxMessages` is maximum number of messages in one `SendTransaction` that the wallet supports
  | { name: 'SignData' };

export type DeviceInfo = {
  platform: 'iphone' | 'ipad' | 'android' | 'windows' | 'mac' | 'linux';
  appName: string; // e.g. "Tonkeeper"
  appVersion: string; // e.g. "2.3.367"
  maxProtocolVersion: number;
  features: Feature[]; // list of supported features and methods in RPC
  // Currently there is only one feature -- 'SendTransaction';
};

export interface WalletInfo {
  name: string;
  image: string;
  tondns?: string;
  about_url: string;
}

export type ConnectRequest = {
  manifestUrl: string;
  items: ConnectItem[]; // data items to share with the app
};

type ConnectItem = TonAddressItem | TonProofItem;

type TonAddressItem = {
  name: 'ton_addr';
};

type TonProofItem = {
  name: 'ton_proof';
  payload: string; // arbitrary payload, e.g. nonce + expiration timestamp.
};

// Untrusted data returned by the wallet.
// If you need a guarantee that the user owns this address and public key, you need to additionally request a ton_proof.
type TonAddressItemReply = {
  name: 'ton_addr';
  address: string; // TON address raw (`0:<hex>`)
  network: NETWORK; // network global_id
  publicKey: string; // HEX string without 0x
  walletStateInit: string; // Base64 (not url safe) encoded state init cell for the wallet contract
};

type TonProofItemReply = TonProofItemReplySuccess | TonProofItemReplyError;

type TonProofItemReplySuccess = {
  name: 'ton_proof';
  proof: {
    timestamp: string; // 64-bit unix epoch time of the signing operation (seconds)
    domain: {
      lengthBytes: number; // AppDomain Length
      value: string; // app domain name (as url part, without encoding)
    };
    signature: string; // base64-encoded signature
    payload: string; // payload from the request
  };
};

type TonProofItemReplyError = {
  name: 'ton_addr';
  error: {
    code: number;
    message?: string;
  };
};

export type ConnectItemReply = TonAddressItemReply | TonProofItemReply;

type ConnectEventSuccess = {
  event: 'connect';
  id?: number;
  payload: {
    items: ConnectItemReply[];
    device: DeviceInfo;
  };
};

export type ConnectEventError = {
  event: 'connect_error';
  id?: number;
  payload: {
    code: number;
    message: string;
  };
};

export type ConnectEvent = ConnectEventSuccess | ConnectEventError;

export type WalletResponse = WalletResponseSuccess | WalletResponseError;

interface WalletResponseSuccess {
  result: string;
  id: string;
}

export interface WalletResponseError {
  error: { code: number; message: string; data?: unknown };
  id: string;
}

export interface WalletEvent {
  event: WalletEventName;
  id?: number;
  payload: any;
}

type WalletEventName = 'connect' | 'connect_error' | 'disconnect';

export interface AppRequest {
  method: string;
  params: string[];
  id: string;
}

export type TonConnectCallback = (event: WalletEvent) => void;

export interface ITonBridgeConfig {
  isWalletBrowser: boolean;
  walletInfo: WalletInfo;
  deviceInfo: DeviceInfo;
}

export interface TonConnectBridge {
  deviceInfo: DeviceInfo;
  walletInfo?: WalletInfo;
  protocolVersion: number;
  isWalletBrowser: boolean;
  connect(
    protocolVersion: number,
    message: ConnectRequest,
  ): Promise<ConnectEvent>;
  restoreConnection(): Promise<ConnectEvent>;
  send(message: AppRequest): Promise<WalletResponse>;
  listen(callback: (event: WalletEvent) => void): () => void;
}
