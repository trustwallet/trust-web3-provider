// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import BaseProvider from "./base_provider";
import { PublicKey } from "@solana/web3.js";
import bs58 from 'bs58';

class TrustSolanaWeb3Provider extends BaseProvider {
    constructor(config) {
        super();

        this.isPhantom = true;
        this.isConnected = false;
        this.publicKey = new PublicKey(config.address);
        this.ready = !!config.address;
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
        this.postMessage("signTransaction", 0, payload);
    }

    signAllTransactions(payload) {
        this.postMessage("signAllTransactions", 0, payload);
    }

    sendResponse(id, result) {
        console.log(
          `<== sendResponse id: ${id}, result: ${result}`
        );
        //super.sendResponse(id, result)
    }
}

module.exports = TrustSolanaWeb3Provider;
