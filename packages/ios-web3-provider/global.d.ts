import { IEthereumProviderConfig } from "@trustwallet/web3-provider-ethereum/types/EthereumProvider";

declare global {
  interface Window {
    trustwallet: any;
    webkit: any;
    ethereum: any;
    onto: any;
    _tw_: any;
    setConfig: (config: IEthereumProviderConfig) => void;
  }
}

export {};
