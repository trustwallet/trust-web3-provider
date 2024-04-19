import { StdSignDoc } from '@cosmjs/amino';

export interface SignOptions {
  readonly preferNoSetFee?: boolean;
  readonly preferNoSetMemo?: boolean;
  readonly disableBalanceCheck?: boolean;
}

export declare enum BroadcastMode {
  /** Return after tx commit */
  Block = 'block',
  /** Return after CheckTx */
  Sync = 'sync',
  /** Return right away */
  Async = 'async',
}

export interface DirectSignDoc {
  /** SignDoc bodyBytes */
  bodyBytes: Uint8Array | Buffer;
  /** SignDoc authInfoBytes */
  authInfoBytes: Uint8Array | Buffer;
  /** SignDoc chainId */
  chainId: string | null;
  /** SignDoc accountNumber */
  accountNumber: bigint | null;
}

export interface ICosmosProvider {
  signAmino: (
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: SignOptions,
  ) => Promise<{ signed: StdSignDoc; signature: string }>;

  signDirect: (
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc,
    signOptions?: SignOptions,
  ) => Promise<{ signed: DirectSignDoc; signature: string }>;

  signArbitrary: (
    chainId: string,
    signer: string,
    data: string | Uint8Array,
  ) => Promise<{ signature: string }>;

  sendTx(
    chainId: string,
    tx: Uint8Array,
    mode: BroadcastMode,
  ): Promise<Uint8Array>;
}

export interface ICosmosProviderConfig {
  disableMobileAdapter?: boolean;
  isKeplr?: boolean;
  isTrust?: boolean;
}
