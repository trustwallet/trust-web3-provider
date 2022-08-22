// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import TrustWeb3Provider from "./ethereum_provider";
import TrustSolanaWeb3Provider from "./solana_provider";
import TrustCosmosWeb3Provider from "./cosmos_provider";

const { CosmJSOfflineSigner, CosmJSOfflineSignerOnlyAmino } = require('./cosmjs');

window.trustwallet = {
  Provider: TrustWeb3Provider,
  SolanaProvider: TrustSolanaWeb3Provider,
  CosmosProvider: TrustCosmosWeb3Provider,
  postMessage: null,
};

window.getOfflineSignerForProvider = (chainId, provider) => {
  return new CosmJSOfflineSigner(chainId, provider);
}
window.getOfflineSignerOnlyAminoForProvider = (chainId, provider) => {
  return new CosmJSOfflineSignerOnlyAmino(chainId, provider);
}
window.getOfflineSignerAutoForProvider = (chainId, provider) => {
  return new CosmJSOfflineSigner(chainId, provider);
}