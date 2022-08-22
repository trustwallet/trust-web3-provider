// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import BaseProvider from "./base_provider";
import Utils from "./utils";
import ProviderRpcError from "./error";
import { Buffer } from "buffer";

const { CosmJSOfflineSigner, CosmJSOfflineSignerOnlyAmino } = require('./cosmjs');

export class TrustCosmosWeb3Provider extends BaseProvider {
  constructor(config) {
    super(config);

    this.providerNetwork = "cosmos";
    this.callbacks = new Map();
    this.mode = "extension";
    this.isKeplr = true;
    this.version = "0.10.16";
    console.log(`constructor`);
  }

  enable(chainIds) {
    console.log(`==> enable for ${chainIds}`);
  }

  getKey(chainId) {
    return this._request("requestAccounts", {chainId: chainId}).then((response) => {
      const account = JSON.parse(response.replace(/\r?\n|\r/g, '\\r\\n'));
      console.log(`==> received publickey ${account.pubKey}`);
      console.log(`==> received address ${account.address}`);
      console.log(`==> received add ${JSON.stringify(account)}`);

      return {
        name: "",
        algo: "secp256k1",
        pubKey: Buffer.from(account.pubKey, 'hex'),
        address: account.address,
        bech32Address: account.address,
        isNanoLedger: false,
      };
    });
  }

  experimentalSuggestChain(chainInfo) {
    return this._request("experimentalSuggestChain", chainInfo);
  }

  signAmino(chainId, signerAddress, signDoc, signOptions) {
    return this._request("signAmino", signDoc).then((signatureJSON) => {
      const signature = JSON.parse(signatureJSON.replace(/\r?\n|\r/g, '\\r\\n'));
      const signed = signDoc;
      return {signed, signature}
    })
  }

  signDirect(chainId, signerAddress, signDoc) {
    return this._request("signDirect", { raw: signDoc.bodyBytes }).then((signatureJSON) => {
      const signature = JSON.parse(signatureJSON.replace(/\r?\n|\r/g, '\\r\\n'));
      const signed = signDoc;
      return {signed, signature}
    })
  }

  sendTx(chainId, tx, mode) {
    const tx_bytes = Buffer.from(tx).toString("base64");
    console.log(`==> final tx hash: ${tx_bytes}`);
    return this._request("sendTx", {raw: tx_bytes, mode: mode}).then((tx_hash) => {
      return Buffer.from(tx_hash, "hex");
    });
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
          return this.postMessage("requestAccounts", id, payload);
        case "experimentalSuggestChain":
          return this.postMessage("switchChain", id, payload);
        case "signAmino":
          return this.postMessage("signTransaction", id, payload);
        case "signDirect":
          return this.postMessage("signRawTransaction", id, payload);
        case "sendTx":
          return this.postMessage("sendRawTransaction", id, payload); 
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
