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
  constructor() {
    super();

    this.callbacks = new Map();
    this.isPhantom = true;
    this.publicKey = null;
    this.isDebug = true;
    this.connection = new Connection(
      Web3.clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
  }

  connect() {
    return this._request("requestAccounts").then((addresses) => {
      this.publicKey = new PublicKey(addresses[0]); // always 1 address for solana
      this.emit("connect");
    });
  }

  disconnect() {
    return new Promise((resolve) => {
      this.publicKey = null;
      this.emit("disconnect");
      resolve();
    });
  }

  setAddress(address) {
    this.publicKey = new PublicKey(address);
  }

  signMessage(payload) {
    console.log("signMessage", payload);
  }

  signTransaction(payload) {
    this.signAllTransactions([payload]);
  }

  signAllTransactions(payload) {
    this._request(
      "signAllTransactions",
      payload.map((tx) => bs58.encode(tx.serializeMessage()))
    )
      .then((signaturesEncoded) => {
        const signatures = signaturesEncoded.map((s) => bs58.decode(s));
        payload.map((tx, idx) => {
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

  postMessage(handler, id, data) {
    super.postMessage(handler, id, data, "solana");
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
          resolve(data);
        }
      });

      switch (method) {
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
