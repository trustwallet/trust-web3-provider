import 'core-js';
import { v4 as uuidv4 } from 'uuid';

import { SolanaProvider } from '@trustwallet/web3-provider-solana';
import { EthereumProvider } from '@trustwallet/web3-provider-ethereum';
import { CosmosProvider } from '@trustwallet/web3-provider-cosmos';
import { Web3Provider } from '@trustwallet/web3-provider-core';
import { AptosProvider } from '@trustwallet/web3-provider-aptos';
import { TonBridge, TonProvider } from '@trustwallet/web3-provider-ton';

import type {
  AdapterStrategyType,
  IHandler,
} from '@trustwallet/web3-provider-core/adapter/Adapter';

import type { ISolanaProviderConfig } from '@trustwallet/web3-provider-solana/types/SolanaProvider';
import type { ICosmosProviderConfig } from '@trustwallet/web3-provider-cosmos/types/CosmosProvider';
import type { IEthereumProviderConfig } from '@trustwallet/web3-provider-ethereum/types/EthereumProvider';
import type { IAptosProviderConfig } from '@trustwallet/web3-provider-aptos/types/AptosProvider';

import type { ITonProviderConfig } from '@trustwallet/web3-provider-ton/types/TonProvider';
import type { ITonBridgeConfig } from '@trustwallet/web3-provider-ton/types/TonBridge';

const core = (strategy: AdapterStrategyType, handler?: IHandler) =>
  new Web3Provider({ strategy, handler });

const solana = (config: ISolanaProviderConfig) => new SolanaProvider(config);

const cosmos = (config: ICosmosProviderConfig) => new CosmosProvider(config);

const ethereum = (config: IEthereumProviderConfig) =>
  new EthereumProvider(config);

const aptos = (config: IAptosProviderConfig) => new AptosProvider(config);

const ton = (config: ITonProviderConfig) => new TonProvider(config);

const tonBridge = (config: ITonBridgeConfig, provider: TonProvider) =>
  new TonBridge(config, provider);

window.trustwallet = {
  core,
  solana,
  cosmos,
  ethereum,
  aptos,
  ton,
  tonBridge,
  randomUUID: () => uuidv4(),
};
