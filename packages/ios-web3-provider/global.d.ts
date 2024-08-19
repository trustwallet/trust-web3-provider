import IEthereumProvider from "@trustwallet/web3-provider-ethereum/types/EthereumProvider";
import { IWalletConfig } from ".";
import ISolanaProvider from "@trustwallet/web3-provider-solana/types/SolanaProvider";
import IAptosProvider from "@trustwallet/web3-provider-aptos/types/AptosProvider";
import ITonProvider from "@trustwallet/web3-provider-ton/types/TonProvider";

declare global {
  interface Window {
    trustwallet: any;
    webkit: any;
    ethereum: IEthereumProvider;
    onto: any;
    phantom: any;
    solana: ISolanaProvider;
    aptos: IAptosProvider;
    ton: ITonProvider;
    _tw_: any;
    setConfig: (config: IWalletConfig) => void;
  }
}

export {};
