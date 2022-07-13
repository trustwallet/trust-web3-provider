// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import BaseProvider from "./base_provider";
import { PublicKey } from "@solana/web3.js";
import bs58 from 'bs58';
import Utils from "./utils";
import ProviderRpcError from "./error";

class TrustSolanaWeb3Provider extends BaseProvider {
    constructor(config) {
        super();

        this.callbacks = new Map();
        this.isPhantom = true;
        this.isConnected = false;
        this.publicKey = new PublicKey(config.address);
        this.ready = !!config.address;
        this.isDebug = true;
    }

    connect() {
        return new Promise((resolve) => {
            this.isConnected = true;
            this.emit("connect");
            resolve();
        });
    }

    signMessage(payload) {
        console.log("signMessage", payload);
    }

    signTransaction(payload) {
        this.postMessage("signTransaction", payload.id, payload);
    }

    signAllTransactions(payload) {
        this._request("signAllTransactions", payload)
        .then((signaturesEncoded) => {
            const signatures = signaturesEncoded.map((s) => bs58.decode(s));
            const transactions = payload.map((tx, idx) => {
                console.log(
                  `<== Signature size: ${signatures[idx].length}`
                );
                tx.addSignature(this.publicKey, signatures[idx]);
                console.log(
                  `<== Signed succesfully: ${JSON.stringify(tx)}`
                );
                let isVerifiedSignature = tx.verifySignatures();
                console.log(`The signatures were verifed: ${isVerifiedSignature}`)
                return tx;
            });
            console.log(
              `<== Signed transactions: ${transactions}`
            );
        })
        .catch((error) => {
            console.log(`<== Error ${error}`);
        });
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
          default:
            // call upstream rpc
            throw new ProviderRpcError(
                4200,
                `Trust does not support calling ${payload.method}. Please use your own solution`
            );
        }
      });
    }

    /**
     * @private Internal native result -> js
     */
    sendResponse(id, result) {
      let originId = id;
      let callback = this.callbacks.get(id);
      let data = { jsonrpc: "2.0", id: originId };
      if (
        result !== null &&
        typeof result === "object" &&
        result.jsonrpc &&
        result.result
      ) {
        data.result = result.result;
      } else {
        data.result = result;
      }
      if (this.isDebug) {
        console.log(
          `<== sendResponse id: ${id}, result: ${JSON.stringify(
            result
          )}, data: ${JSON.stringify(data)}`
        );
      }
      if (callback) {
        callback(null, result);
        console.log(`deleted id: ${id}`);
        this.callbacks.delete(id);
      } else {
        console.log(`callback id: ${id} not found`);
      }
    }

    fillJsonRpcVersion(payload) {
      if (payload.jsonrpc === undefined) {
        payload.jsonrpc = "2.0";
      }
    }
}

module.exports = TrustSolanaWeb3Provider;
