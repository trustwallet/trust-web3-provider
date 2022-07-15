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
        this._request("signAllTransactions", payload.map((tx) => bs58.encode(tx.serializeMessage())))
        .then((signaturesEncoded) => {
            const signatures = signaturesEncoded.map((s) => bs58.decode(s));
            const web3 = require('@solana/web3.js');
            let connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
            const transactions = payload.map((tx, idx) => {
                tx.addSignature(this.publicKey, signatures[idx]);
                let isVerifiedSignature = tx.verifySignatures();
                const rawTx = bs58.encode(tx.serialize());
                web3.sendAndConfirmRawTransaction(connection, tx.serialize());
                return tx;
            });
        })
        .catch((error) => {
            console.log(`<== Error: ${error}`);
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
}

module.exports = TrustSolanaWeb3Provider;
