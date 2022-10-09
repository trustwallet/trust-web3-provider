// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import BaseProvider from "./base_provider";
import Utils from "./utils";

class TrustAptosWeb3Provider extends BaseProvider {
  constructor(config) {
    super(config);

    this.providerNetwork = "aptos";
    this.callbacks = new Map();
    this._isConnected = false;
    this.isPetra = true;
    this.isMartian = true;
  }

  connect() {
    return this.account().then((accountInfo) => {
      this._isConnected = true;
      this.emit("connect");
      return accountInfo;
    });
  }

  disconnect() {
    return new Promise((resolve) => {
      this.publicKey = null;
      this._isConnected = false;
      this.emit("disconnect");
      resolve();
    });
  }

  isConnected() {
    return this._isConnected;
  }

  account() {
    return this._request("requestAccounts").then((data) => {
      return JSON.parse(data);
    });
  }

  async signAndSubmitTransaction(tx) {
    const signedTx = await this.signTransaction(tx);
    const signResponse = await this._request("submitTransaction", { tx: JSON.parse(signedTx) });
    return signResponse;
  }

  signTransaction(tx) {
    return this._request("signTransaction", { data: tx })
      .catch((error) => {
        console.log(`<== Error: ${error}`);
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
          return this.postMessage("requestAccounts", id, {});
        case "signTransaction":
          return this.postMessage("signTransaction", id, payload);
        case "submitTransaction":
            return this.postMessage("sendTransaction", id, payload);
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

module.exports = TrustAptosWeb3Provider;
