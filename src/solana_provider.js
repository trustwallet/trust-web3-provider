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
import { default as Start } from "./adapter";

const { PublicKey, Connection } = Web3;

class TrustSolanaWeb3Provider extends BaseProvider {
  constructor(config) {
    super(config);

    this.providerNetwork = "solana";
    this.callbacks = new Map();
    this.publicKey = null;
    this.isConnected = false;
    this.connection = new Connection(
      Web3.clusterApiUrl(config.solana.cluster),
      "confirmed"
    );

    Start(this);
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

  emitAccountChanged() {
    this.emit("accountChanged", this.publicKey);
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

  mapSignedTransaction(tx, signatureEncoded) {
    const signature = bs58.decode(signatureEncoded);

    tx.addSignature(this.publicKey, signature);

    if (this.isDebug) {
      console.log(`==> signed single ${JSON.stringify(tx)}`);
    }

    return tx;
  }

  signTransaction(tx) {
    const data = JSON.stringify(tx);
    const version = tx.version;

    const raw = Buffer.from(
      tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      })
    ).toString("base64");

    const rawMessage = Buffer.from(tx.message.serialize()).toString("base64");

    return this._request("signRawTransaction", {
      data,
      raw,
      rawMessage,
      version,
    })
      .then((signatureEncoded) =>
        this.mapSignedTransaction(tx, signatureEncoded)
      )
      .catch((error) => {
        console.log(`<== Error: ${error}`);
      });
  }

  signAllTransactions(txs) {
    return Promise.all(txs.map((tx) => this.signTransaction(tx)));
  }

  signAllTransactionsV2(txs) {
    return this._request("signRawTransactionMulti", {
      transactions: txs.map((tx) => {
        const data = JSON.stringify(tx);
        const version = tx.version;

        const rawMessage = Buffer.from(tx.message.serialize()).toString(
          "base64"
        );

        const raw = Buffer.from(
          tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          })
        ).toString("base64");

        return { data, raw, rawMessage, version };
      }),
    })
      .then((signaturesEncoded) =>
        signaturesEncoded.map((signature, i) =>
          this.mapSignedTransaction(txs[i], signature)
        )
      )
      .catch((error) => {
        console.log(`<== Error: ${error}`);
      });
  }

  signAndSendTransaction(tx, options) {
    if (this.isDebug) {
      console.log(
        `==> signAndSendTransaction ${JSON.stringify(tx)}, options: ${options}`
      );
    }
    return this.signTransaction(tx).then(async (signedTx) => {
      const signature = await this.connection.sendRawTransaction(
        signedTx.serialize(),
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
        case "signRawTransactionMulti":
          return this.postMessage("signRawTransactionMulti", id, payload);
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
