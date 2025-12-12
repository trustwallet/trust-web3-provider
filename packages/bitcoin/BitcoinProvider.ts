import { BaseProvider } from '@trustwallet/web3-provider-core';
import type IBitcoinProvider from './types/BitcoinProvider';
import type {
  IBitcoinProviderConfig,
  BtcAccount,
  SignMessageParams,
  SignMessageResponse,
  SignPSBTParams,
  PushPSBTParams,
  PushPSBTResponse,
} from './types/BitcoinProvider';
import { initialize } from './adapter';

export class BitcoinProvider extends BaseProvider implements IBitcoinProvider {
  static NETWORK = 'bitcoin';

  private _isConnected = false;

  private _accounts: BtcAccount[] = [];

  #enableAdapter = true;

  static bufferToHex(buffer: Buffer | Uint8Array | string) {
    return '0x' + Buffer.from(buffer).toString('hex');
  }

  static hexToUint8Array(hex: string): Uint8Array {
    const cleanHex = hex.replace('0x', '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return bytes;
  }

  constructor(config?: IBitcoinProviderConfig) {
    super();

    if (config) {
      if (typeof config.enableAdapter !== 'undefined') {
        this.#enableAdapter = config.enableAdapter;
      }
    }

    if (this.#enableAdapter) {
      initialize(this);
    }
  }

  async connect() {
    const accounts = await this.requestAccounts();
    this._isConnected = true;
    this._accounts = accounts;
    this.emit('connect');
    return accounts;
  }

  disconnect() {
    this._isConnected = false;
    this._accounts = [];
    this.emit('disconnect');
  }

  isConnected() {
    return this._isConnected;
  }

  getNetwork(): string {
    return BitcoinProvider.NETWORK;
  }

  async requestAccounts(): Promise<BtcAccount[]> {
    const data = await this.request<string>({
      method: 'requestAccounts',
      params: {},
    });

    const accounts = JSON.parse(data);
    this._accounts = accounts;

    // Emit accountsChanged event when accounts are fetched
    this.emit('accountsChanged', accounts);

    return accounts;
  }

  async signMessage(params: SignMessageParams): Promise<SignMessageResponse> {
    const messageHex = BitcoinProvider.bufferToHex(params.message);

    const signatureHex = await this.request<string>({
      method: 'signMessage',
      params: {
        message: messageHex,
        address: params.address,
        originalMethod: 'signMessage',
      },
    });

    const signature = BitcoinProvider.hexToUint8Array(signatureHex);

    return {
      signature,
    };
  }

  async signPSBT(params: SignPSBTParams): Promise<string> {
    const signedPSBT = await this.request<string>({
      method: 'signPSBT',
      params: {
        psbtHex: params.psbtHex,
        options: params.options,
      },
    });

    return signedPSBT;
  }

  async pushPSBT(params: PushPSBTParams): Promise<PushPSBTResponse> {
    const response = await this.request<string>({
      method: 'pushPSBT',
      params: {
        psbtHex: params.psbtHex,
      },
    });

    const result = JSON.parse(response);
    return {
      txid: result.txid,
    };
  }

  /**
   * Get current accounts
   */
  getAccounts(): BtcAccount[] {
    return this._accounts;
  }
}
