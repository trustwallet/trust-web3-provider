// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

class RPCServer {
  constructor(rpcUrl) {
    this.rpcUrl = rpcUrl;
  }

  getBlockNumber() {
    return this.call({jsonrpc: "2.0", method: "eth_blockNumber", params: []})
    .then(json => json.result);
  }

  getBlockByNumber(number) {
    return this.call({jsonrpc: "2.0", method: "eth_getBlockByNumber", params: [number, false]})
    .then(json => json.result);
  }

  getFilterLogs(filter) {
    return this.call({jsonrpc: "2.0", method: "eth_getLogs", params: [filter]});
  }

  call(payload) {
    return fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(json => {
      if (!json.result && json.error) {
        console.log("<== rpc error", json.error);
        throw new Error(json.error.message || "rpc error");
      }
      return json;
    });
  }
}

module.exports = RPCServer;
