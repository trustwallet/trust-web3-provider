import {
  BaseProvider,
  IRequestArguments,
} from '@trustwallet/web3-provider-core';
import {
  BroadcastMode,
  DirectSignDoc,
  ICosmosProvider,
  ICosmosProviderConfig,
} from './types/CosmosProvider';
import { StdSignDoc } from '@cosmjs/amino';
import { MobileAdapter } from './MobileAdapter';
import { WalletAccount } from '@cosmos-kit/core';

export class CosmosProvider extends BaseProvider implements ICosmosProvider {
  static NETWORK = 'cosmos';

  private mobileAdapter!: MobileAdapter;

  #disableMobileAdapter: boolean = false;

  /**
   * Mobile required overwriting this to true
   */
  isKeplr: boolean = true;

  isTrust: boolean = true;

  isTrustWallet: boolean = true;

  constructor(config?: ICosmosProviderConfig) {
    super();

    if (config) {
      if (typeof config.disableMobileAdapter !== 'undefined') {
        this.#disableMobileAdapter = config.disableMobileAdapter;
      }

      if (typeof config.isKeplr !== 'undefined') {
        this.isKeplr = config.isKeplr;
      }

      if (typeof config.isTrust !== 'undefined') {
        this.isTrust = config.isTrust;
        this.isTrustWallet = config.isTrust;
      }
    }

    if (!this.#disableMobileAdapter) {
      this.mobileAdapter = new MobileAdapter(this);
    }
  }

  static bufferToHex(buffer: Buffer | Uint8Array | string) {
    return '0x' + Buffer.from(buffer).toString('hex');
  }

  getNetwork(): string {
    return CosmosProvider.NETWORK;
  }

  isMobileAdapterEnabled() {
    return !this.#disableMobileAdapter;
  }

  enable(chainIds: string | string[]): Promise<void> {
    return this.request({
      method: 'enable',
      params: { chainIds },
    });
  }

  /**
   * Call request handler directly
   * @param args
   * @returns
   */
  internalRequest<T>(args: IRequestArguments): Promise<T> {
    return super.request<T>(args);
  }

  /**
   * request order is
   *
   *  mobileAdapter (if enabled)
   *        -----> client handler (internalRequest)
   *
   * @param args
   * @returns
   */
  request<T>(args: IRequestArguments): Promise<T> {
    const next = () => {
      return this.internalRequest(args) as Promise<T>;
    };

    if (this.mobileAdapter) {
      return this.mobileAdapter.request(args, next);
    }

    return next();
  }

  getKey(chainId: string) {
    return this.request<WalletAccount>({
      method: 'getKey',
      params: { chainId: chainId },
    });
  }

  async sendTx(
    chainId: string,
    tx: Uint8Array,
    mode: BroadcastMode,
  ): Promise<Uint8Array> {
    const raw = Buffer.from(tx).toString('base64');

    const hash = await this.request<string>({
      method: 'sendTx',
      params: {
        raw,
        chainId,
        mode,
      },
    });

    return new Uint8Array(Buffer.from(hash, 'hex'));
  }

  async signArbitrary(
    chainId: string,
    signerAddress: string,
    payload: string | Uint8Array,
  ) {
    const buffer = Buffer.from(payload);
    const data = CosmosProvider.bufferToHex(buffer);

    const signature = await this.request<{ signature: string }>({
      method: 'signArbitrary',
      params: {
        chainId,
        data,
        signerAddress,
      },
    });

    return signature;
  }

  async signAmino(chainId: string, _signer: string, signDoc: StdSignDoc) {
    const response = await this.request<string>({
      method: 'signAmino',
      params: {
        chainId,
        sign_doc: signDoc,
      },
    });

    const { signed, signature } = JSON.parse(response);
    return { signed: signed as StdSignDoc, signature };
  }

  async signDirect(
    chainId: string,
    signerAddress: string,
    signDoc: DirectSignDoc,
  ) {
    const object = {
      bodyBytes: CosmosProvider.bufferToHex(signDoc.bodyBytes),
      authInfoBytes: CosmosProvider.bufferToHex(signDoc.authInfoBytes),
    };

    const response = await this.request<string>({
      method: 'signDirect',
      params: {
        signerAddress,
        chainId,
        sign_doc: object,
      },
    });

    const { signature } = JSON.parse(response);
    return { signed: signDoc, signature: signature as string };
  }

  experimentalSuggestChain() {}

  getOfflineSignerDirect(chainId: string) {
    return {
      getAccounts: async () => {
        return [await this.getKey(chainId)];
      },

      signDirect: async (signerAddress: string, signDoc: DirectSignDoc) => {
        if (chainId !== signDoc.chainId) {
          throw new Error('Unmatched chain id with the offline signer');
        }

        const key = await this.getKey(signDoc.chainId);

        if (key.address !== signerAddress) {
          throw new Error('Unknown signer address');
        }

        return await this.signDirect(chainId, signerAddress, signDoc);
      },
    };
  }

  getOfflineSigner(chainId: string) {
    return this.getOfflineSignerAmino(chainId);
  }

  getOfflineSignerAuto(chainId: string) {
    return this.getOfflineSignerAmino(chainId);
  }

  getOfflineSignerAmino(chainId: string) {
    return {
      getAccounts: async () => {
        const key = (await this.getKey(chainId)) as unknown as {
          pubKey: Buffer;
          bech32Address: string;
        };

        return [
          {
            address: key.bech32Address,
            algo: 'secp256k1',
            pubkey: key.pubKey,
          },
        ];
      },

      sign: (signerAddress: string, signDoc: StdSignDoc) => {
        return this.signAmino(chainId, signerAddress, signDoc);
      },

      signAmino: (signerAddress: string, signDoc: StdSignDoc) => {
        return this.signAmino(chainId, signerAddress, signDoc);
      },
    };
  }
}
