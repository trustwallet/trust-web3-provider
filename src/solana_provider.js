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
    this.isPhantom = true;
    this.publicKey = null;
    this.isConnected = false;
    // FIXME read from config, default is mainnet-beta
    this.connection = new Connection(
      Web3.clusterApiUrl("mainnet-beta"),
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
    return this._request("signMessage", {data: hex});
  }

  signTransaction(tx) {
    return this.signAllTransactions([tx]);
  }
  
  signAllTransactions(txs) {
    const encodedTxs = txs.map((tx) => bs58.encode(tx.serializeMessage()))
    return this._request("signAllTransactions", encodedTxs)
      .then((signaturesEncoded) => {
        const signatures = signaturesEncoded.map((s) => bs58.decode(s));
        txs.map((tx, idx) => {
          tx.addSignature(this.publicKey, signatures[idx]);
          if (!tx.verifySignatures()) {
            throw new ProviderRpcError(4300, "Invalid signature");
          }
          this._sendAndConfirmRawTransaction(tx);
          return tx;
        });
      })
      .catch((error) => {
        console.log(`<== Error: ${error}`);
      });
  }

  signAndSendTransaction(tx) {
    return this._request("signAndSendTransaction", tx);
  }

  /**
   * @private Send raw transaction with default strategy
   */
  _sendAndConfirmRawTransaction(tx) {
    Web3.sendAndConfirmRawTransaction(
      this.connection,
      tx.serialize(),
      Web3.BlockheightBasedTransactionConfirmationStrategy
    );
  }

  /**
   * @private Internal rpc handler
   */
  _request(method, payload) {
    if (this.isDebug) {
      console.log(`==> _request payload ${JSON.stringify(payload)}`);
    }
    return new Promise((resolve, reject) => {
      const id = Utils.genId();
      console.log(`==> setting id ${id}`);
      this.callbacks.set(id, (error, data) => {
        if (error) {
          reject(error);
        } else {
          // FIXME should be handled in adapter level
          if (method === "signMessage") {
            const result = {
              signature: new Uint8Array(Utils.messageToBuffer(data).buffer)
            };
            resolve(result);
          } else {
            resolve(data);
          }          
        }
      });

      switch (method) {
        case "signMessage":
          return this.postMessage("signMessage", id, payload);
        case "signAllTransactions":
          return this.postMessage("signAllTransactions", id, payload);
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
