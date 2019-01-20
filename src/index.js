"use strict";

import Web3 from "web3";
import FilterMgr from "./filter";
import RPCServer from "./rpc";
import Utils from "./utils";
import IdMapping from "./id_mapping";

class TrustWeb3Provider {
  constructor(config) {
    this.setConfig(config);

    this.idMapping = new IdMapping();

    this.callbacks = new Map;
    this.isTrust = true;
  }

  isConnected() {
    return true;
  }

  setAddress(address) {
    this.address = (address || "").toLowerCase();
    this.ready = !!address;
  }

  setConfig(config) {
    this.setAddress(config.address);

    this.chainId = config.chainId;
    this.rpc = new RPCServer(config.rpcUrl);
    this.filterMgr = new FilterMgr(this.rpc);
  }

  enable() {
    // this may be undefined somehow
    var that = this || window.ethereum;
    return that._sendAsync({
      method: "eth_requestAccounts",
      params: []
    })
    .then(result => {
      return result.result;
    });
  }

  send(payload) {
    let response = {
      jsonrpc: "2.0",
      id: payload.id
    };
    switch(payload.method) {
      case "eth_accounts":
        response.result = this.eth_accounts();
        break;
      case "eth_coinbase":
        response.result = this.eth_coinbase();
        break;
      case "net_version":
        response.result = this.net_version();
        break;
      case "eth_uninstallFilter":
        this.sendAsync(payload, (error) => {
          if (error) {
            console.log(`<== uninstallFilter ${error}`);
          }
        });
        response.result = true;
        break;
      default:
        throw new Error(`Trust does not support calling ${payload.method} synchronously without a callback. Please provide a callback parameter to call ${payload.method} asynchronously.`);
    }
    return response;
  }

  sendAsync(payload, callback) {
    if (Array.isArray(payload)) {
      Promise.all(payload.map(this._sendAsync.bind(this)))
      .then(data => callback(null, data))
      .catch(error => callback(error, null));
    } else {
      this._sendAsync(payload)
      .then(data => callback(null, data))
      .catch(error => callback(error, null));
    }
  }

  _sendAsync(payload) {
    this.idMapping.tryIntifyId(payload);
    return new Promise((resolve, reject) => {
      if (!payload.id) {
        payload.id = Utils.genId();
      }
      this.callbacks.set(payload.id, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      switch(payload.method) {
        case "eth_accounts":
          return this.sendResponse(payload.id, this.eth_accounts());
        case "eth_coinbase":
          return this.sendResponse(payload.id, this.eth_coinbase());
        case "net_version":
          return this.sendResponse(payload.id, this.net_version());
        case "eth_sign":
          return this.eth_sign(payload);
        case "personal_sign":
          return this.personal_sign(payload);
        case "personal_ecRecover":
          return this.personal_ecRecover(payload);
        case "eth_signTypedData":
        case "eth_signTypedData_v3":
          return this.eth_signTypedData(payload);
        case "eth_sendTransaction":
          return this.eth_sendTransaction(payload);
        case "eth_requestAccounts":
          return this.eth_requestAccounts(payload);
        case "eth_newFilter":
          return this.eth_newFilter(payload);
        case "eth_newBlockFilter":
          return this.eth_newBlockFilter(payload);
        case "eth_newPendingTransactionFilter":
          return this.eth_newPendingTransactionFilter(payload);
        case "eth_uninstallFilter":
          return this.eth_uninstallFilter(payload);
        case "eth_getFilterChanges":
          return this.eth_getFilterChanges(payload);
        case "eth_getFilterLogs":
          return this.eth_getFilterLogs(payload);
        default:
          this.callbacks.delete(payload.id);
          return this.rpc.call(payload).then(resolve).catch(reject);
      }
    });
  }

  eth_accounts() {
    return this.address ? [this.address] : [];
  }

  eth_coinbase() {
    return this.address;
  }

  net_version() {
    return this.chainId.toString(10) || null;
  }

  eth_sign(payload) {
    this.postMessage("signMessage", payload.id, {data: payload.params[1]});
  }

  personal_sign(payload) {
    this.postMessage("signPersonalMessage", payload.id, {data: payload.params[0]});
  }

  personal_ecRecover(payload) {
    this.postMessage("ecRecover", payload.id, {signature: payload.params[1], message: payload.params[0]});
  }

  eth_signTypedData(payload) {
    this.postMessage("signTypedMessage", payload.id, {data: payload.params[1]});
  }

  eth_sendTransaction(payload) {
    this.postMessage("signTransaction", payload.id, payload.params[0]);
  }

  eth_requestAccounts(payload) {
    this.postMessage("requestAccounts", payload.id, {});
  }

  eth_newFilter(payload) {
    this.filterMgr.newFilter(payload)
    .then(filterId => this.sendResponse(payload.id, filterId))
    .catch(error => this.sendError(payload.id, error));
  }

  eth_newBlockFilter(payload) {
    this.filterMgr.newBlockFilter()
    .then(filterId => this.sendResponse(payload.id, filterId))
    .catch(error => this.sendError(payload.id, error));
  }

  eth_newPendingTransactionFilter(payload) {
    this.filterMgr.newPendingTransactionFilter()
    .then(filterId => this.sendResponse(payload.id, filterId))
    .catch(error => this.sendError(payload.id, error));
  }

  eth_uninstallFilter(payload) {
    this.filterMgr.uninstallFilter(payload.params[0])
    .then(filterId => this.sendResponse(payload.id, filterId))
    .catch(error => this.sendError(payload.id, error));
  }

  eth_getFilterChanges(payload) {
    this.filterMgr.getFilterChanges(payload.params[0])
    .then(data => this.sendResponse(payload.id, data))
    .catch(error => this.sendError(payload.id, error));
  }

  eth_getFilterLogs(payload) {
    this.filterMgr.getFilterLogs(payload.params[0])
    .then(data => this.sendResponse(payload.id, data))
    .catch(error => this.sendError(payload.id, error));
  }

  postMessage(handler, id, data) {
    if (this.ready || handler === "requestAccounts") {
      window.webkit.messageHandlers[handler].postMessage({
        "name": handler,
        "object": data,
        "id": id
      });
    } else {
      // don't forget to verify in the app
      this.sendError(id, new Error("provider is not ready"));
    }
  }

  sendResponse(id, result) {
    let originId = this.idMapping.tryPopId(id) || id;
    let callback = this.callbacks.get(id);
    let data = {jsonrpc: "2.0", id: originId};
    if (typeof result === "object" && result.jsonrpc && result.result) {
      data.result = result.result;
    } else {
      data.result = result;
    }
    if (callback) {
      callback(null, data);
      this.callbacks.delete(id);
    }
  }

  sendError(id, error) {
    console.log(`<== ${id} sendError ${error}`);
    let callback = this.callbacks.get(id);
    if (callback) {
      callback(error instanceof Error ? error : new Error(error), null);
      this.callbacks.delete(id);
    }
  }
}

window.Trust = TrustWeb3Provider;
window.Web3 = Web3;
