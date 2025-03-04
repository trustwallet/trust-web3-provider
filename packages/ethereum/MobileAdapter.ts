import type { IRequestArguments, IWatchAsset } from './types';

import { EthereumProvider } from './EthereumProvider';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';
import { RPCError } from './exceptions/RPCError';

/**
 * Adapting some requests to legacy mobile API
 *
 * This adapter provides the APIs with the method names and params the extension and mobile are
 * ready to handle, also fallbacks to RPC service in case it does not handle the request
 */
export class MobileAdapter {
  #unsupportedMethods: string[] = [
    'eth_newFilter',
    'eth_newBlockFilter',
    'eth_newPendingTransactionFilter',
    'eth_uninstallFilter',
    'eth_subscribe',
  ];

  private provider!: EthereumProvider;

  static isUTF8(buffer: Buffer) {
    try {
      new TextDecoder('utf8', { fatal: true }).decode(buffer);
      return true;
    } catch {
      return false;
    }
  }

  static bufferToHex(buffer: Buffer | string) {
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

  constructor(provider: EthereumProvider) {
    this.provider = provider;
  }

  async request<T>(args: IRequestArguments): Promise<T> {
    if (this.#unsupportedMethods.includes(args.method)) {
      return Promise.reject(
        new RPCError(
          4200,
          `EthereumProvider does not support calling ${args.method}`,
        ),
      );
    }

    switch (args.method) {
      case 'wallet_requestPermissions':
        return this.provider.internalRequest({
          method: 'wallet_requestPermissions',
          params: args.params,
        });
      case 'eth_requestAccounts':
        return this.provider.internalRequest({
          method: 'requestAccounts',
          params: {},
        });
      case 'eth_sign':
        return this.ethSign(args.params as [string, string]);
      case 'personal_sign':
        return this.personalSign(args.params as [string, string]);
      case 'personal_ecRecover':
        return this.personalECRecover(args.params as [string, string]);
      case 'eth_signTypedData_v3':
        return this.ethSignTypedData(
          args.params as [string, string],
          SignTypedDataVersion.V3,
        );
      case 'eth_signTypedData_v4':
        return this.ethSignTypedData(
          args.params as [string, string],
          SignTypedDataVersion.V4,
        );
      case 'eth_signTypedData':
        return this.ethSignTypedData(
          args.params as [string, string],
          SignTypedDataVersion.V1,
        );
      case 'eth_sendTransaction':
        return this.provider.internalRequest({
          method: 'signTransaction',
          params: (args.params as object[])[0],
        });
      case 'wallet_watchAsset': {
        const { options, type } = args.params as unknown as IWatchAsset;
        const { address, symbol, decimals } = options;

        let fetchedSymbol;
        let fetchedDecimals;

        if (!symbol) {
          try {
            // call for symbol() = 0x95d89b41
            const result = await this.contractCall(address, '0x95d89b41');
            const hexString = result.slice(2);

            // The offset is the position where the dynamic data starts
            const offset = parseInt(hexString.slice(0, 64), 16);

            // The length of the string is at the offset position
            const length = parseInt(
              hexString.slice(offset * 2, offset * 2 + 64),
              16,
            );

            // The actual string data starts right after the length field
            const stringDataStart = offset * 2 + 64;
            const stringDataHex = hexString.slice(
              stringDataStart,
              stringDataStart + length * 2,
            );

            fetchedSymbol = '';

            for (let i = 0; i < stringDataHex.length; i += 2) {
              const hexChar = stringDataHex.slice(i, i + 2);
              const char = String.fromCharCode(parseInt(hexChar, 16));

              if (char === '\x00') break;
              fetchedSymbol += char;
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (!decimals) {
          try {
            // call for decimals() = 0x313ce567
            const result = await this.contractCall(address, '0x313ce567');
            fetchedDecimals = parseInt(result, 16);
          } catch (e) {
            console.error(e);
          }
        }

        return this.provider.internalRequest({
          method: 'watchAsset',
          params: {
            type,
            contract: address,
            symbol: symbol || fetchedSymbol,
            decimals: decimals || fetchedDecimals,
          },
        });
      }
      case 'wallet_addEthereumChain':
        return this.provider.internalRequest({
          method: 'addEthereumChain',
          params: (args.params as object[])[0],
        });
      case 'wallet_switchEthereumChain':
        return this.provider.internalRequest({
          method: 'switchEthereumChain',
          params: (args.params as object[])[0],
        });
      default: {
        const res = await this.provider.getRPC().call({
          method: args.method,
          jsonrpc: '2.0',
          params: args.params,
        });

        return res;
      }
    }
  }

  private personalECRecover<T>(params: [string, string]): Promise<T> {
    return this.provider.internalRequest({
      method: 'ecRecover',
      params: {
        signature: params[1],
        message: params[0],
      },
    });
  }

  private async personalSign<T>(params: [string, string]): Promise<T> {
    const [originalAddress] = await this.provider.request<string[]>({
      method: 'eth_accounts',
    });

    if (!originalAddress) {
      throw new Error('Unable to execute personal_sign');
    }

    let [message, address] = params;

    if (
      typeof message === 'string' &&
      originalAddress.toLowerCase() === message.toLowerCase()
    ) {
      message = params[1];
      address = params[0];
    }

    const buffer = MobileAdapter.messageToBuffer(message);

    return this.provider.internalRequest({
      method: 'signPersonalMessage',
      params: {
        data:
          buffer.length === 0 ? MobileAdapter.bufferToHex(message) : message,
        address,
      },
    });
  }

  private ethSign<T>(params: [string, string]): Promise<T> {
    if (!params) {
      throw new Error('Missing params');
    }

    const [address, message] = params;

    const buffer = MobileAdapter.messageToBuffer(message);
    const data = MobileAdapter.bufferToHex(buffer);

    return this.provider.internalRequest<T>({
      method: MobileAdapter.isUTF8(buffer)
        ? 'signPersonalMessage'
        : 'signMessage',
      params: { data, address, isEthSign: true },
    });
  }

  private async ethSignTypedData<T>(
    params: [string, string],
    version: SignTypedDataVersion,
  ): Promise<T> {
    const [originalAddress] = await this.provider.request<string[]>({
      method: 'eth_accounts',
    });

    if (!originalAddress) {
      throw new Error(
        'Unable to execute ethSignTypedData, address is not present',
      );
    }

    let [data, address] = params;

    if (
      typeof data === 'string' &&
      originalAddress.toLowerCase() === data.toLowerCase()
    ) {
      data = params[1];
      address = params[0];
    }

    const message = typeof data === 'string' ? JSON.parse(data) : data;

    const { chainId } = message.domain || {};

    if (
      typeof chainId !== 'undefined' &&
      Number(chainId) !== Number(this.provider.getChainId())
    ) {
      throw new Error(
        'Provided chainId does not match the currently active chain',
      );
    }

    const hash =
      version !== SignTypedDataVersion.V1
        ? TypedDataUtils.eip712Hash(message, version)
        : '';

    return this.provider.internalRequest({
      method: 'signTypedMessage',
      params: {
        data: '0x' + hash.toString('hex'),
        raw: typeof data === 'string' ? data : JSON.stringify(data),
        address,
        version,
      },
    });
  }

  contractCall(address: string, method: string) {
    return this.provider.getRPC().call({
      method: 'eth_call',
      jsonrpc: '2.0',
      params: [
        {
          to: address,
          data: method,
        },
        'latest',
      ],
    });
  }
}
