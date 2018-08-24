import Web3 from "web3";

class TrustWeb3Provider {
  constructor(config) {
    this.address = config.address;
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;

    this.callbacks = new Map;
    this.intIds = new Map;
    this.isTrust = true;
  }

  isConnected() {
    return true;
  }

  send(payload) {
    var response = {
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
      default:
        throw new Error("Trust does not support calling " + payload.method + " synchronously without a callback. Please provide a callback parameter to call " + payload.method + " asynchronously.");
    }
    return response;
  }

  sendAsync(payload, callback) {
    this.intifyId(payload);
    this.callbacks.set(payload.id, callback);
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
      case "eth_signTypedData":
        return this.eth_signTypedData(payload);
      case "eth_sendTransaction":
        return this.eth_sendTransaction(payload);
      default:
        return this.doRemoteRPC(payload, callback);
    }
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

  eth_signTypedData(payload) {
    this.postMessage("signTypedMessage", payload.id, {data: payload.params[0]});
  }

  eth_sendTransaction(payload) {
    this.postMessage("signTransaction", payload.id, payload.params[0]);
  }

  intifyId(payload) {
    if (!payload.id) {
      payload.id = this.genId();
      return;
    }
    if (typeof payload.id !== "number") {
      let newId = this.genId();
      this.intIds.set(newId, payload.id);
      payload.id = newId;
    }
  }

  genId() {
    return new Date().getTime() + Math.floor(Math.random() * 1000);
  }

  postMessage(handler, id, data) {
    window.webkit.messageHandlers[handler].postMessage({
        "name": handler,
        "object": data,
        "id": id
      });
  }

  sendResponse(id, result) {
    let callback = this.callbacks.get(id);
    let data = {jsonrpc: "2.0", id: this.intIds.get(id) || id, result};
    if (callback) {
      callback(null, data);
      this.callbacks.delete(id);
      this.intIds.delete(id);
    }
    return data;
  }

  sendError(id, error) {
    let callback = this.callbacks.get(id);
    if (callback) {
      callback(error, null);
      this.callbacks.delete(id);
      this.intIds.delete(id);
    }
  }

  doRemoteRPC(payload, callback) {
    fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(json => {
      callback(null, json);
    })
    .catch(error => {
      callback(error, null);
    });
  }
}

window.Trust = TrustWeb3Provider;
window.Web3 = Web3;
