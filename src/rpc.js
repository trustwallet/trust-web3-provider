"use strict";

import Utils from "./utils";

class RPCServer {
  constructor(rpcUrl) {
    this.rpcUrl = rpcUrl;
    this.intIds = new Map;
  }

  _intifyId(payload) {
    if (!payload.id) {
      payload.id = Utils.genId();
      return;
    }
    if (typeof payload.id !== "number") {
      let newId = Utils.genId();
      this.intIds.set(newId, payload.id);
      payload.id = newId;
    }
  }

  _restoreId(payload) {
    let id = this.intIds.get(payload.id);
    if (id) {
      this.intIds.delete(payload.id);
      payload.id = id;
    }
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
    this._intifyId(payload);
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
      this._restoreId(json);
      return json;
    });
  }
}

module.exports = RPCServer;
