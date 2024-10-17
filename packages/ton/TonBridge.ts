import { TonConnectError } from './exceptions/TonConnectError';
import { TonProvider } from './TonProvider';
import {
  AppRequest,
  ConnectEvent,
  ConnectEventError,
  ConnectItemReply,
  ConnectRequest,
  DeviceInfo,
  ITonBridgeConfig,
  TonConnectBridge,
  TonConnectCallback,
  WalletEvent,
  WalletInfo,
  WalletResponse,
  WalletResponseError,
} from './types/TonBridge';

const formatConnectEventError = (error: TonConnectError): ConnectEventError => {
  return {
    event: 'connect_error',
    payload: {
      code: error.code ?? 0,
      message: error.message,
    },
  };
};

/**
 * Ton bridge implementation
 *
 * Based on https://docs.ton.org/develop/dapps/ton-connect/protocol & open mask
 */
export class TonBridge implements TonConnectBridge {
  deviceInfo!: DeviceInfo;
  walletInfo?: WalletInfo | undefined;
  protocolVersion: number = 2;
  isWalletBrowser: boolean = true;

  private provider!: TonProvider;
  private callbacks: TonConnectCallback[] = [];

  constructor(config: ITonBridgeConfig, provider: TonProvider) {
    if (config) {
      if (typeof config.isWalletBrowser !== 'undefined') {
        this.isWalletBrowser = config.isWalletBrowser;
      }

      if (config.walletInfo) {
        this.walletInfo = config.walletInfo;
      }

      if (config.deviceInfo) {
        this.deviceInfo = config.deviceInfo;
      }
    }

    this.provider = provider;
  }

  /**
   * Connect
   * @param protocolVersion
   * @param message
   * @returns
   */
  async connect(
    protocolVersion: number,
    message: ConnectRequest,
  ): Promise<ConnectEvent> {
    if (protocolVersion > this.protocolVersion) {
      new TonConnectError('Unsupported protocol version', 1);
    }

    const items = await this.provider.send<ConnectItemReply[]>(
      'tonConnect_connect',
      message,
    );

    if ((items as any)?.event === 'connect_error') {
      return this.emit(items as any);
    } else {
      return this.emit({
        event: 'connect',
        payload: { items, device: this.deviceInfo },
      });
    }
  }

  async disconnect() {
    await this.provider.send('tonConnect_disconnect', {});

    return this.emit({
      event: 'disconnect',
      payload: {},
    });
  }

  /**
   * Return and call callbacks
   * @param event
   * @returns
   */
  private emit<E extends ConnectEvent | WalletEvent>(event: E): E {
    this.callbacks.forEach((item) => item(event));
    return event;
  }

  /**
   * Reconnect implementation
   * @returns
   */
  async restoreConnection(): Promise<ConnectEvent> {
    try {
      const items = await this.provider.send<ConnectItemReply[]>(
        'tonConnect_reconnect',
        [{ name: 'ton_addr' }],
      );

      return this.emit({
        event: 'connect',
        payload: {
          items,
          device: this.deviceInfo,
        },
      });
    } catch (e) {
      if (e instanceof TonConnectError) {
        return this.emit(formatConnectEventError(e));
      } else {
        return this.emit(
          formatConnectEventError(
            new TonConnectError((e as Error).message ?? 'Unknown error'),
          ),
        );
      }
    }
  }

  /**
   * Send ton method tonConnect_${method}
   * @param message
   * @returns
   */
  async send(message: AppRequest): Promise<WalletResponse> {
    try {
      const result = await this.provider.send<string>(
        `tonConnect_${message.method}`,
        message.params.map((item) => JSON.parse(item)),
      );

      return { result, id: message.id.toString() };
    } catch (e) {
      return {
        error: e as WalletResponseError['error'],
        id: String(message.id),
      };
    }
  }

  /**
   * Callback like listen to events
   * @param callback
   * @returns
   */
  listen = (callback: (event: WalletEvent) => void): (() => void) => {
    this.callbacks.push(callback);

    return () => {
      this.callbacks = this.callbacks.filter((item) => item != callback);
    };
  };
}
