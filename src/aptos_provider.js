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
    this.setConfig(config.aptos);
  }

  setConfig(config) {
    this._network = config.network;
    this.address = config.address;
    this.chainId = config.chainId;
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

  network() {
    return this._network;
  }

  async signMessage(payload) {
    let prefix = "APTOS";
    let address = (await this.account()).address;

    var fullMessage = prefix
    let application = window.location.protocol + "//" + window.location.hostname;
    if (payload.address) {
      fullMessage += "\naddress: " + address;
    }
    if (payload.application) {
      fullMessage += "\napplication: " + application;
    }
    if (payload.chainId) {
      fullMessage += "\nchainId: " + this.chainId;
    }
    fullMessage += "\nmessage: " + payload.message;
    fullMessage += "\nnonce: " + payload.nonce;
    const buffer = Buffer.from(fullMessage);
    const hex = Utils.bufferToHex(buffer);

    return this._request("signMessage", { data: hex })
    .then((hex) => {
      return {
        address: address,
        application: application,
        chainId: this.chainId,
        fullMessage: fullMessage,
        message: payload.message,
        nonce: payload.nonce,
        prefix: prefix,
        signature: Utils.messageToBuffer(hex).toString()
      };
    });
  }

  async signAndSubmitTransaction(tx) {
    const signedTx = await this.signTransaction(tx);
    return this._request("submitTransaction", { tx: signedTx })
      .then((hex) => {
        return { hash: Utils.messageToBuffer(hex).toString() };
      });
  }

  signTransaction(tx) {
    return this._request("signTransaction", { data: tx })
      .then((hex) => {
        return JSON.parse(Utils.messageToBuffer(hex).toString());
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
        case "signMessage":
          return this.postMessage("signMessage", id, payload);
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
