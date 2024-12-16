import { Address, WalletContractV4 } from '@ton/ton';
import { TonConnectError } from './exceptions/TonConnectError';
import { TonProvider } from './TonProvider';
import {
  ConnectItemReply,
  TonAddressItemReply,
  TonProofItemReplySuccess,
} from './types/TonBridge';

interface ITransaction {
  valid_until: number;
  messages: {
    stateInit: string;
    state_init: string;
    address: string;
    amount: string;
  }[];
  network: string;
  from: string;
}

interface TransformedTransaction {
  messages: ITransaction['messages'];
  valid_until: number;
  network: string;
  from: string;
}

/**
 * Adapting some requests to legacy mobile API
 *
 * This adapter provides the APIs with the method names and params the extension and mobile are
 * ready to handle
 */
export class MobileAdapter {
  provider: TonProvider;

  private rawAddress: string | null = null;

  constructor(provider: TonProvider) {
    this.provider = provider;
  }

  static mapToCamelCase(transaction: ITransaction): TransformedTransaction {
    return {
      ...transaction,
      ...(transaction?.messages
        ? {
            messages: (transaction?.messages || []).map((message) => ({
              ...message,
              ...('state_init' in message || 'stateInit' in message
                ? { stateInit: message.state_init || message.stateInit }
                : {}),
            })),
          }
        : {}),
    };
  }

  async request<T>(method: string, params?: unknown[] | object): Promise<T> {
    switch (method) {
      case 'tonConnect_connect': {
        const res = await this.provider.internalRequest<string>(
          'requestAccounts',
          params,
        );

        // Internally we use nonBounceable value, here we remove it from the response
        return JSON.parse(res).map((item: ConnectItemReply) => {
          if (item.name === 'ton_addr') {
            const { nonBounceable, type, ...rest } =
              item as TonAddressItemReply & {
                nonBounceable: string;
                type?: string;
              };

            if (type) {
              console.warn('type parameter removed from request');
            }

            this.rawAddress = rest.address;

            return rest;
          }

          if (item.name === 'ton_proof') {
            const { type, ...response } = item as TonProofItemReplySuccess & {
              type?: string;
            };

            return {
              ...response,
              proof: {
                ...response.proof,
                timestamp: parseInt(response.proof.timestamp),
              },
            };
          }

          return item;
        });
      }

      case 'tonConnect_reconnect': {
        const res = await this.provider.internalRequest<string>(
          'tonConnect_reconnect',
          params,
        );

        const parsedResponse = JSON.parse(res);

        const { nonBounceable, type, ...rest } =
          parsedResponse[0] as TonAddressItemReply & {
            nonBounceable: string;
            type?: string;
          };

        this.rawAddress = rest.address;

        return [rest] as T;
      }

      case 'ton_rawSign':
        return this.provider.internalRequest<T>('signMessage', params);

      case 'ton_sendTransaction':
      case 'tonConnect_sendTransaction': {
        const tx = (params as object[])[0] as ITransaction;

        this.validateNetwork(tx);
        this.validateMessagesAddresses(tx);
        this.validateFromAddress(tx);
        this.validateTransaction(MobileAdapter.mapToCamelCase(tx));

        const res = await this.provider.internalRequest<string>(
          'signTransaction',
          MobileAdapter.mapToCamelCase(tx),
        );

        const { nonce, hash } = JSON.parse(res);

        return method === 'ton_sendTransaction' ? nonce : hash;
      }

      case 'ton_requestAccounts': {
        const res = await this.provider.internalRequest<string>(
          'requestAccounts',
          params,
        );

        const [{ nonBounceable }] = JSON.parse(res);
        return [nonBounceable] as T;
      }

      case 'ton_requestWallets': {
        const res = await this.provider.internalRequest<string>(
          'requestAccounts',
          params,
        );

        const [{ nonBounceable, publicKey }] = JSON.parse(res);

        return [
          {
            address: nonBounceable,
            publicKey,
            version: this.provider.version,
          },
        ] as T;
      }

      default:
        return this.provider.internalRequest(method, params);
    }
  }

  validateTransaction(tx: TransformedTransaction) {
    // throw error if there is a message with empty state init
    if (
      tx.messages.some(
        (message) => 'stateInit' in message && message.stateInit.length === 0,
      )
    ) {
      console.error('Empty state init in message');
      throw new TonConnectError('Bad request', 1);
    }

    // throw error if there is a message with amount not being a string
    if (tx.messages.some((message) => typeof message.amount !== 'string')) {
      console.error('Invalid amount type');
      throw new TonConnectError('Bad request', 1);
    }

    // throw error if valid until is not a number
    if (typeof tx.valid_until !== 'number') {
      console.error('Invalid valid_until type');
      throw new TonConnectError('Bad request', 1);
    }
  }

  validateFromAddress(tx: ITransaction) {
    if (!this.rawAddress) {
      console.error('Trying to execute transaction with invalid address');
      throw new TonConnectError('Bad request', 1);
    }

    const address = Address.parseRaw(this.rawAddress);

    const collection = [
      address.toRawString(),
      address.toString({ bounceable: true }),
      address.toString({ bounceable: false }),
    ];

    if (!collection.includes(tx.from)) {
      console.error('from field does not match any user address');
      throw new TonConnectError('Bad request');
    }
  }

  /**
   * Validation on messages
   * @param tx
   */
  validateMessagesAddresses(tx: ITransaction) {
    // Message addresses can not be raw
    if (tx.messages.some((e) => e.address.includes(':'))) {
      console.error('Bad request, message address is invalid');
      throw new TonConnectError('Bad request');
    }
  }

  /**
   * Enforce mainnet
   * @param tx
   */
  validateNetwork(tx: ITransaction) {
    if (tx.network !== '-239') {
      console.error('Bad request, network id is invalid');
      throw new TonConnectError('Bad request');
    }
  }
}
