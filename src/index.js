"use strict";

import PlasmaWeb3Provider from "./ethereum_provider";
import PlasmaSolanaWeb3Provider from "./solana_provider";
import PlasmaCosmosWeb3Provider from "./cosmos_provider";
import PlasmaAptosWeb3Provider from "./aptos_provider";

window.plasmawallet = {
  Provider: PlasmaWeb3Provider,
  SolanaProvider: PlasmaSolanaWeb3Provider,
  CosmosProvider: PlasmaCosmosWeb3Provider,
  AptosProvider: PlasmaAptosWeb3Provider,
  postMessage: null,
};
