import type IEthereumProvider from './types/EthereumProvider';

export interface IRequestArguments {
  method: string;
  params?: unknown[] | object;
}

export type IProviderAccounts = string[];

export interface IProviderMessage {
  type: string;
  data: unknown;
}

export interface IProviderInfo {
  chainId: string;
}

export interface IProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

export type IProviderChainId = IProviderInfo['chainId'];

export enum EmitterSupportedEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  CHAIN_CHANGED = 'chainChanged',
  ACCOUNTS_CHANGED = 'accountsChanged',
}

export declare namespace IProviderEvents {
  type IEvent =
    | 'connect'
    | 'disconnect'
    | 'message'
    | 'chainChanged'
    | 'accountsChanged';

  interface IEventArguments {
    connect: IProviderInfo;
    disconnect: IProviderRpcError;
    message: IProviderMessage;
    chainChanged: IProviderChainId;
    accountsChanged: IProviderAccounts;
  }
}

export interface IEthereumProviderListener {
  on: <E extends IProviderEvents.IEvent>(
    event: E,
    listener: (args: IProviderEvents.IEventArguments[E]) => void,
  ) => IEthereumProvider;

  once: <E extends IProviderEvents.IEvent>(
    event: E,
    listener: (args: IProviderEvents.IEventArguments[E]) => void,
  ) => IEthereumProvider;

  off: <E extends IProviderEvents.IEvent>(
    event: E,
    listener: (args: IProviderEvents.IEventArguments[E]) => void,
  ) => IEthereumProvider;

  removeListener: <E extends IProviderEvents.IEvent>(
    event: E,
    listener: (args: IProviderEvents.IEventArguments[E]) => void,
  ) => IEthereumProvider;

  emit: <E extends IProviderEvents.IEvent>(
    event: E,
    payload: IProviderEvents.IEventArguments[E],
  ) => boolean;
}

export interface IWatchAsset {
  type: string;
  options: {
    type: string;
    address: string;
    symbol: string;
    decimals: number;
  };
}
