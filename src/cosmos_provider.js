// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import BaseProvider from "./base_provider";
import Utils from "./utils";
import ProviderRpcError from "./error";

const { CosmJSOfflineSigner, CosmJSOfflineSignerOnlyAmino } = require('./cosmjs');

export class TrustCosmosWeb3Provider extends BaseProvider {
  constructor(config) {
    super(config);

    this.providerNetwork = "cosmos";
    this.callbacks = new Map();
    this.mode = "extension";
    this.version = "0.10.16";
    console.log(`constructor`);
  }

  enable(chainIds) {
    console.log(`==> enable for ${chainIds}`);
  }

  getOfflineSigner(chainId) {
    console.log(`==> getOfflineSigner for ${chainId}`);
    return new CosmJSOfflineSigner(chainId, this);
  }

  getOfflineSignerOnlyAmino(chainId) {
    console.log(`==> getOfflineSignerOnlyAmino for ${chainId}`);
    return new CosmJSOfflineSignerOnlyAmino(chainId, this);
  }

  getKey(chainId) {
    return this._request("requestAccounts").then((addresses) => {
      console.log(`==> received addresses ${addresses[0]}`);

      return {
        name: "",
        algo: "secp256k1",
        pubKey: addresses[0],
        address: addresses[0],
        bech32Address: addresses[0],
        isNanoLedger: false,
      };
    });
  }

  signAmino(chainId, signerAddress, signDoc) {
    return this._request("signAmino")
  }

  signDirect(chainId, signerAddress, signDoc) {
    return this._request("signDirect")
  }

  experimentalSuggestChain(chainInfo) {
    return this._request("experimentalSuggestChain", chainInfo);
  }

    /**
   * @private Internal rpc handler
   */
  _request(method, payload) {
    if (this.isDebug) {
      console.log(
        `==> _request method: ${method}, payload ${JSON.stringify(payload)}`
      );
    }
    return new Promise((resolve, reject) => {
      const id = Utils.genId();
      console.log(`==> setting id ${id}`);
      this.callbacks.set(id, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      switch (method) {
        case "requestAccounts":
          return this.postMessage("requestAccounts", id, {});
        case "experimentalSuggestChain":
          return this.postMessage("switchChain", id, payload);
        default:
          // throw errors for unsupported methods
          throw new ProviderRpcError(
            4200,
            `Trust does not support calling ${payload.method} yet.`
          );
      }
    });
  }
}

module.exports = TrustCosmosWeb3Provider;
