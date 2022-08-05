// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import BaseProvider from "./base_provider";
import * as Web3 from "@solana/web3.js";
import bs58 from "bs58";
import Utils from "./utils";
import ProviderRpcError from "./error";

const { PublicKey, Connection } = Web3;

class TrustSolanaWeb3Provider extends BaseProvider {
  constructor(config) {
    super(config);

    this.providerNetwork = "solana";
    this.callbacks = new Map();
    this.publicKey = null;
    this.isConnected = false;
    this.connection = new Connection(
      Web3.clusterApiUrl(config.cluster),
      "confirmed"
    );
  }

  connect() {
    return this._request("requestAccounts").then((addresses) => {
      this.setAddress(addresses[0]);
      this.emit("connect");
    });
  }

  disconnect() {
    return new Promise((resolve) => {
      this.publicKey = null;
      this.isConnected = false;
      this.emit("disconnect");
      resolve();
    });
  }

  setAddress(address) {
    this.publicKey = new PublicKey(address);
    this.isConnected = true;
  }

  signMessage(message) {
    const hex = Utils.bufferToHex(message);
    if (this.isDebug) {
      console.log(`==> signMessage ${message}, hex: ${hex}`);
    }
    return this._request("signMessage", { data: hex }).then((data) => {
      return {
        signature: new Uint8Array(Utils.messageToBuffer(data).buffer),
      };
    });
  }

  signTransaction(tx) {
    return this._request("signRawTransaction", {
      data: JSON.stringify(tx),
      raw: bs58.encode(tx.serializeMessage()),
    })
      .then((signatureEncoded) => {
        const signature = bs58.decode(signatureEncoded);
        tx.addSignature(this.publicKey, signature);
        if (!tx.verifySignatures()) {
          throw new ProviderRpcError(4300, "Invalid signature");
        }
        if (this.isDebug) {
          console.log(`==> signed single ${JSON.stringify(tx)}`);
        }
        return tx;
      })
      .catch((error) => {
        console.log(`<== Error: ${error}`);
      });
  }

  signAllTransactions(txs) {
    return Promise.all(txs.map((tx) => this.signTransaction(tx)));
  }

  signAndSendTransaction(tx, options) {
    if (this.isDebug) {
      console.log(
        `==> signAndSendTransaction ${JSON.stringify(tx)}, options: ${options}`
      );
    }
    return this.signTransaction(tx).then(async (signedTx) => {
      const signature = await Web3.sendAndConfirmRawTransaction(
        this.connection,
        signedTx.serialize(),
        Web3.BlockheightBasedTransactionConfirmationStrategy,
        options
      );
      return { signature: signature };
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
        case "signMessage":
          return this.postMessage("signMessage", id, payload);
        case "signRawTransaction":
          return this.postMessage("signRawTransaction", id, payload);
        case "requestAccounts":
          return this.postMessage("requestAccounts", id, {});
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

module.exports = TrustSolanaWeb3Provider;
