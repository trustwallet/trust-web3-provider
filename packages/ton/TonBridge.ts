import { RPCError } from './exceptions/RPCError';
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

const formatConnectEventError = (
  error: TonConnectError,
  id: number,
): ConnectEventError => {
  return {
    id: id ?? 0,
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
  private connectionAttempts = 0;

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
  ): Promise<ConnectEvent | WalletResponseError> {
    try {
      if (protocolVersion > this.protocolVersion) {
        new TonConnectError('Unsupported protocol version', 1);
      }

      const items = await this.provider.send<ConnectItemReply[]>(
        'tonConnect_connect',
        message,
      );

      this.connectionAttempts += 1;

      if ((items as any)?.event === 'connect_error') {
        return this.emit({
          event: 'connect_error',
          payload: {
            code: 300,
            message: 'User declined the transaction',
          },
          id: this.connectionAttempts,
        });
      } else {
        return this.emit({
          id: this.connectionAttempts,
          event: 'connect',
          payload: { items, device: this.deviceInfo },
        });
      }
    } catch (e) {
      return this.emit(
        formatConnectEventError(e as TonConnectError, this.connectionAttempts),
      );
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
    this.callbacks.forEach((item) => item(event as any));
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

      this.connectionAttempts += 1;

      if ((items as any)?.event === 'connect_error') {
        return this.emit({
          ...(items as any),
          id: this.connectionAttempts.toString(),
        });
      }

      return this.emit({
        id: this.connectionAttempts,
        event: 'connect',
        payload: {
          items,
          device: this.deviceInfo,
        },
      });
    } catch (e) {
      if (e instanceof TonConnectError) {
        return this.emit(formatConnectEventError(e, this.connectionAttempts));
      } else {
        return this.emit(
          formatConnectEventError(
            new TonConnectError((e as Error).message ?? 'Unknown error'),
            this.connectionAttempts,
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
  async send(
    message: AppRequest,
  ): Promise<WalletResponse | WalletResponseError> {
    try {
      const result = await this.provider.send<string>(
        `tonConnect_${message.method}`,
        message.params.map((item) => JSON.parse(item)),
      );

      return { result, id: message.id.toString() };
    } catch (e) {
      return this.parseError(e, {
        id: message.id.toString(),
      }) as WalletResponseError;
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

  private parseError(e: any, message: { id?: number | string }) {
    if ((e as any)?.code === 4001) {
      return {
        error: {
          message: 'User declined the transaction',
          code: 300,
        },
        id: String(message.id) ?? '0',
      };
    }

    // If there are too many requests
    if ((e as any)?.code === -32002 || (e as any)?.code === '-32002') {
      return {
        error: {
          message: 'Bad request',
          code: 1,
        },
        id: String(message.id) ?? '0',
      };
    }

    // Set default error code if needed
    if (
      (e as WalletResponseError['error']) &&
      ![0, 1, 100, 300, 400].includes((e as WalletResponseError['error']).code)
    ) {
      return {
        error: {
          message: 'Bad request',
          code: 1,
        },
        id: String(message.id) ?? '0',
      };
    }

    return {
      error: formatConnectEventError(e as TonConnectError, 0),
      id: String(message.id) ?? '0',
    };
  }
}
