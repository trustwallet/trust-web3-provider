// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import BaseProvider from "./base_provider";
import { PublicKey } from "@solana/web3.js";

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

    signAllTransactions(transactions) {
        const message = transactions.map(transaction => {
            return transaction.serializeMessage().toString("hex");
        });
        this.postMessage("signTransaction", 0, message);
    }
}

module.exports = TrustSolanaWeb3Provider;
