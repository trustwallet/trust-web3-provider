"use strict";

import IdMapping from "./id_mapping";

class RPCServer {
  constructor(rpcUrl) {
    this.rpcUrl = rpcUrl;
    this.idMapping = new IdMapping();
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
    // console.log("==> call rpc ", payload);
    this.idMapping.tryIntifyId(payload);
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
      // console.log("<== rpc result", json);
      if (!json.result && json.error) {
        console.log("<== rpc error", json.error);
        throw new Error(json.error.message || "rpc error");
      }
      this.idMapping.tryRestoreId(json);
      return json;
    });
  }
}

module.exports = RPCServer;
