import { SolanaProvider } from '@trustwallet/web3-provider-solana';
import { EthereumProvider } from '@trustwallet/web3-provider-ethereum';
import { CosmosProvider } from '@trustwallet/web3-provider-cosmos';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import {
  AdapterStrategyType,
  IHandler,
} from '@trustwallet/web3-provider-core/dist/types/adapter/Adapter';
import { ISolanaProviderConfig } from '@trustwallet/web3-provider-solana/dist/types/types/SolanaProvider';
import { ICosmosProviderConfig } from '@trustwallet/web3-provider-cosmos/dist/types/types/CosmosProvider';
import { IEthereumProviderConfig } from '@trustwallet/web3-provider-ethereum/dist/types/types/EthereumProvider';

const core = (strategy: AdapterStrategyType, handler?: IHandler) =>
  new Web3Provider({ strategy, handler });

const solana = (config: ISolanaProviderConfig) => new SolanaProvider(config);

const cosmos = (config: ICosmosProviderConfig) => new CosmosProvider(config);

const ethereum = (config: IEthereumProviderConfig) =>
  new EthereumProvider(config);

window.trustwallet = {
  core,
  solana,
  cosmos,
  ethereum,
};
