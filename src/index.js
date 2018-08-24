import Web3 from "web3";

class TrustWeb3Provider {
  constructor(config) {
    this.callbacks = new Map;
    this.isTrust = true;
    this.address = config.address;
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;
  }

  postMessage(handler, payload) {
    let data = payload.params[0];
    window.webkit.messageHandlers[handler].postMessage({
        "name": handler,
        "object": handler === "signTransaction" ? data : {data},
        "id": payload.id
      });
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
    this.postMessage("signMessage", payload);
  }

  personal_sign(payload) {
    this.postMessage("signPersonalMessage", payload);
  }

  eth_signTypedData(payload) {
    this.postMessage("signTypedMessage", payload);
  }

  eth_sendTransaction(payload) {
    this.postMessage("signTransaction", payload);
  }

  sendResponse(id, result) {
    let callback = this.callbacks.get(id);
    let data = {jsonrpc: "2.0", id, result};
    if (callback) {
      callback(null, data);
      this.callbacks.delete(id);
    }
    return data;
  }

  sendError(id, error) {
    let callback = this.callbacks.get(id);
    if (callback) {
      callback(error, null);
      this.callbacks.delete(id);
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
