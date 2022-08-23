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

export class TrustCosmosWeb3Provider extends BaseProvider {
  constructor(config) {
    super(config);

    this.providerNetwork = "cosmos";
    this.callbacks = new Map();
    this.mode = "extension";
    this.isKeplr = true;
    this.version = "0.10.16";
    
    this.setConfig(config);
    console.log(`constructor`);
  }

  enable(chainIds) {
    console.log(`==> enabled for ${chainIds}`);
  }

  setConfig(config) {
    this.chainId = config.chainId;
  }

  updateChainId(chainId) {
    const config = {
      chainId: chainId
    };
    this.setConfig(config);
  }

  getKey(chainId) {
    this.updateChainId(chainId);
    return this.getAccounts().then((accounts) => {
      return accounts[0];
    });
  }

  getAccounts() {
    return this._request("requestAccounts", { chainId: this.chainId }).then(
      (response) => {
        const account = JSON.parse(response);
        return [
          {
            algo: "secp256k1",
            address: account.address,
            bech32Address: account.address,
            pubkey: Buffer.from(account.pubKey, "hex")
          }
        ];
      }
    );
  }

  experimentalSuggestChain(chainInfo) {
    return this._request("experimentalSuggestChain", chainInfo);
  }

  sign(signerAddress, signDoc) {
    return this.signAmino(signerAddress, signDoc);
  }

  signAmino(param1, param2, param3) {
    let signerAddress = "";
    let signDoc = {};
    if (param3) {
      this.updateChainId(param1);
      signerAddress = param2;
      signDoc = param3;
    } else {
      signerAddress = param1;
      signDoc = param2;
    }
    
    return this._signAmino(signerAddress, signDoc);
  }

  _signAmino(signerAddress, signDoc) {
    return this._request("signAmino", signDoc).then((signature) => {
      // FIXME assgin signature to signDoc
      return { signed: signDoc, signature: JSON.parse(signature) };
    });
  }

  signDirect(param1, param2, param3) {
    let signerAddress = "";
    let signDoc = {};
    if (param3) {
      this.updateChainId(param1);
      signerAddress = param2;
      signDoc = param3;
    } else {
      signerAddress = param1;
      signDoc = param2;
    }
    
    return this._signDirect(signerAddress, signDoc);
  }

  _signDirect(signerAddress, signDoc) {
    const object = {
      body_bytes: Utils.bufferToHex(signDoc.bodyBytes),
      auth_info_bytes: Utils.bufferToHex(signDoc.authInfoBytes),
      chain_id: signDoc.chainId,
      account_number: signDoc.accountNumber.toString(),
    };
    return this._request("signDirect", object).then((signature) => {
      console.log(`==> signature: ${signature}`);
      // FIXME assgin signature to signDoc
      return { signed: signDoc, signature: JSON.parse(signature) };
    });
  }

  sendTx(chainId, tx, mode) {
    const tx_bytes = Buffer.from(tx).toString("base64");
    console.log(`==> final tx hash: ${tx_bytes}`);
    return this._request("sendTx", { raw: tx_bytes, mode: mode }).then(
      (tx_hash) => {
        return Buffer.from(tx_hash, "hex");
      }
    );
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
