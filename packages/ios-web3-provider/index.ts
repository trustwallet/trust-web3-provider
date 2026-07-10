import { SolanaProvider } from '@trustwallet/web3-provider-solana';
import {
  EthereumProvider,
  NativeRPC,
} from '@trustwallet/web3-provider-ethereum';
import { CosmosProvider } from '@trustwallet/web3-provider-cosmos';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import {
  AdapterStrategyType,
  IHandler,
} from '@trustwallet/web3-provider-core/adapter/Adapter';
import { ISolanaProviderConfig } from '@trustwallet/web3-provider-solana/types/SolanaProvider';
import { ICosmosProviderConfig } from '@trustwallet/web3-provider-cosmos/types/CosmosProvider';
import { IEthereumProviderConfig } from '@trustwallet/web3-provider-ethereum/types/EthereumProvider';
import { AptosProvider } from '@trustwallet/web3-provider-aptos';
import { IAptosProviderConfig } from '@trustwallet/web3-provider-aptos/types/AptosProvider';
import { ITonProviderConfig } from '@trustwallet/web3-provider-ton/types/TonProvider';
import { ITonBridgeConfig } from '@trustwallet/web3-provider-ton/types/TonBridge';
import { TonBridge, TonProvider } from '@trustwallet/web3-provider-ton';
import { TronProvider } from '@trustwallet/web3-provider-tron';
import { ITronProviderConfig } from '@trustwallet/web3-provider-tron/types/TronProvider';

const core = (strategy: AdapterStrategyType, handler?: IHandler) =>
  new Web3Provider({ strategy, handler });

const solana = (config: ISolanaProviderConfig) => new SolanaProvider(config);

const cosmos = (config: ICosmosProviderConfig) => new CosmosProvider(config);

const ethereum = (config: IEthereumProviderConfig) =>
  new EthereumProvider(config);

// Factory for the native-bridge-backed RPC so the injector can plug it in with
// a single line: `ethereum.setRPC(trustwallet.nativeRpc(ethereum))`. Routes
// JSON-RPC reads through the native bridge instead of fetch(), bypassing the
// page's connect-src CSP.
const nativeRpc = (provider: EthereumProvider) => new NativeRPC(provider);

const aptos = (config: IAptosProviderConfig) => new AptosProvider(config);

const ton = (config: ITonProviderConfig) => new TonProvider(config);

const tonBridge = (config: ITonBridgeConfig, provider: TonProvider) =>
  new TonBridge(config, provider);

const tron = (config: ITronProviderConfig) => new TronProvider(config);

window.trustwallet = {
  core,
  solana,
  cosmos,
  ethereum,
  aptos,
  ton,
  tonBridge,
  tron,
  nativeRpc,
};
