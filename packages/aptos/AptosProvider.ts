import { BaseProvider } from '@trustwallet/web3-provider-core';
import type IAptosProvider from './types/AptosProvider';
import type {
  IAptosProviderConfig,
  ISignMessagePayload,
} from './types/AptosProvider';

export class AptosProvider extends BaseProvider implements IAptosProvider {
  static NETWORK = 'aptos';

  private _isConnected = false;

  private _network;

  public chainId: string | null = null;

  public address: string | null = null;

  static bufferToHex(buffer: Buffer | Uint8Array | string) {
    return '0x' + Buffer.from(buffer).toString('hex');
  }

  static messageToBuffer(message: string | Buffer) {
    let buffer = Buffer.from([]);
    try {
      if (typeof message === 'string') {
        buffer = Buffer.from(message.replace('0x', ''), 'hex');
      } else {
        buffer = Buffer.from(message);
      }
    } catch (err) {
      console.log(`messageToBuffer error: ${err}`);
    }

    return buffer;
  }

  constructor(config?: IAptosProviderConfig) {
    super();

    if (config) {
      if (config.network) {
        this._network = config.network;

        if (config.chainId) {
          this.chainId = config.chainId;
        }
      }
    }
  }

  setConfig(config: { network: string; address: string; chainId: string }) {
    this._network = config.network;
    this.address = config.address;
    this.chainId = config.chainId;
  }

  async connect() {
    const accountInfo = await this.account();
    this._isConnected = true;
    this.emit('connect');
    return accountInfo;
  }

  disconnect() {
    this._isConnected = false;
    this.emit('disconnect');
  }

  isConnected() {
    return this._isConnected;
  }

  async account() {
    const data = await this.request<string>({
      method: 'requestAccounts',
      params: {},
    });
    return JSON.parse(data);
  }

  network() {
    return this._network;
  }

  getNetwork(): string {
    return AptosProvider.NETWORK;
  }

  async signMessage(payload: ISignMessagePayload) {
    const prefix = 'APTOS';
    const address = (await this.account()).address;

    let fullMessage = prefix;

    const application =
      window.location.protocol + '//' + window.location.hostname;

    if (payload.address) {
      fullMessage += '\naddress: ' + address;
    }

    if (payload.application) {
      fullMessage += '\napplication: ' + application;
    }

    if (payload.chainId) {
      fullMessage += '\nchainId: ' + this.chainId;
    }

    fullMessage += '\nmessage: ' + payload.message;
    fullMessage += '\nnonce: ' + payload.nonce;

    const buffer = Buffer.from(fullMessage);
    const hex = AptosProvider.bufferToHex(buffer);

    return this.request({ method: 'signMessage', params: { data: hex } }).then(
      (signature) => {
        return {
          address: address,
          application: application,
          chainId: this.chainId,
          fullMessage: fullMessage,
          message: payload.message,
          nonce: payload.nonce,
          prefix: prefix,
          signature: signature,
        };
      },
    );
  }

  async signAndSubmitTransaction(tx: string) {
    const signedTx = await this.signTransaction(tx);

    const hex = await this.request<string>({
      method: 'sendTransaction',
      params: { tx: signedTx },
    });

    return { hash: AptosProvider.messageToBuffer(hex).toString() };
  }

  async signTransaction(tx: string) {
    const hex = await this.request<string>({
      method: 'signTransaction',
      params: { data: tx },
    });

    return JSON.parse(AptosProvider.messageToBuffer(hex).toString());
  }
}
