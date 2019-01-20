"use strict";

import Utils from "./utils";

class FilterMgr {
  constructor(rpc) {
    this.rpc = rpc;
    this.filters = new Map;
    this.blockNumbers = new Map;
    this.timers = new Map;
    this.timeoutInterval = 5 * 60 * 1000;
  }

  newFilter(payload) {
    let filter = {
      type: "log",
      options: this._normalizeFilter(payload.params[0])
    };
    let filterId = this._installFilter(filter);
    // console.log("newFilter installed", payload, filterId);
    return this._getBlockNumber().then(blockNumber => {
      this.blockNumbers.set(filterId, blockNumber);
      return Utils.intToHex(filterId);
    });
  }

  newBlockFilter() {
    let filter = {type: "block", options: "latest"};
    let filterId = this._installFilter(filter);
    return this._getBlockNumber().then(blockNumber => {
      this.blockNumbers.set(filterId, blockNumber);
      return Utils.intToHex(filterId);
    });
  }

  newPendingTransactionFilter() {
    let filter = {type: "tx", options: "pending"};
    let filterId = this._installFilter(filter);
    return this._getBlockNumber().then(blockNumber => {
      this.blockNumbers.set(filterId, blockNumber);
      return Utils.intToHex(filterId);
    });
  }

  _installFilter(filter) {
    let count = this.filters.keys.length;
    let filterId = count + 1;
    filter.id = filterId;
    this.filters.set(filterId, filter);
    this._setupTimer(filterId);
    return filterId;
  }

  uninstallFilter(filterId) {
    let id = Utils.hexToInt(filterId);
    console.log("uninstall filter ", this.filters.get(id));
    this.filters.delete(id);
    this.blockNumbers.delete(id);
    this._clearTimer(id);
    return Promise.resolve(true);
  }

  getFilterChanges(filterId) {
    let id = Utils.hexToInt(filterId);
    let filter = this.filters.get(id);
    if (!filter) { return Promise.reject(new Error("getFilterChanges: no filter found")); }
    switch (filter.type) {
      case "log":
        return this._getLogFilterChanges(filter.id);
      case "block":
        return this._getBlockFilterChanges(filter.id);
      case "tx":
        return this._getTxFilterChanges(filter.id);
      default:
        return Promise.reject(new Error("unsupport filter type"));
    }
  }

  _getLogFilterChanges(filterId) {
    let filter = this.filters.get(filterId).options;
    let fromBlock = this.blockNumbers.get(filterId);
    if (!filter || !fromBlock) {
      return Promise.reject(new Error("_getLogFilterChanges: no filter found"));
    }
    return this._getBlockNumber().then(blockNumber => {
      let toBlock = (filter.toBlock === "latest" ? blockNumber : filter.toBlock);
      let from = Utils.hexToInt(fromBlock);
      let to = Utils.hexToInt(toBlock);
      if (from > to) {
        return [];
      }
      return this.rpc.getFilterLogs(Object.assign({}, filter, {
        fromBlock: fromBlock,
        toBlock: toBlock
      }));
    });
  }

  _getBlockFilterChanges(filterId) {
    return this._getBlocksForFilter(filterId)
    .then(blocks => blocks.map(block => block.hash));
  }

  _getTxFilterChanges(filterId) {
    return this._getBlocksForFilter(filterId)
    .then(blocks => Utils.flatMap(blocks, block => block.transactions));
  }

  _getBlocksForFilter(filterId) {
    let fromBlock = this.blockNumbers.get(filterId);
    if (!fromBlock) { return Promise.reject(new Error("no filter found")); }
    return this._getBlockNumber().then(toBlock => {
      let from = Utils.hexToInt(fromBlock);
      let to = Utils.hexToInt(toBlock);
      if (to > from) {
        this.blockNumbers.set(filterId, toBlock);
      }
      return this._getBlocksInRange(from, to);
    });
  }

  _getBlocksInRange(fromBlock, toBlock) {
    if (fromBlock >= toBlock) {
      return Promise.resolve([]);
    }
    return Promise.all(
      Utils.intRange(fromBlock, toBlock)
      .map(Utils.intToHex)
      .map(this._getBlockByNumber.bind(this))
    );
  }

  _getBlockNumber() {
    return this.rpc.getBlockNumber();
  }

  _getBlockByNumber(number) {
    return this.rpc.getBlockByNumber(number);
  }

  getFilterLogs(filterId) {
    let filter = this.filters.get(Utils.hexToInt(filterId));
    if (!filter) {
      return Promise.reject(new Error("no filter found"));
    }
    return this.rpc.getFilterLogs(this._normalizeParams(filter.options));
  }

  _normalizeParams(filter) {
    var params = {
      fromBlock : this._normalizeParamBlock(filter.fromBlock),
      toBlock : this._normalizeParamBlock(filter.toBlock),
      topics : filter.topics
    };
    if (filter.address) {
      params.address = filter.address;
    }
    return params;
  }

  _normalizeFilter(params) {
    return {
      fromBlock : this._normalizeFilterBlock(params.fromBlock),
      toBlock : this._normalizeFilterBlock(params.toBlock),
      address : undefined === params.address ? null : Array.isArray(params.address) ? params.address : [params.address],
      topics : params.topics || []
    };
  }

  _normalizeFilterBlock(blockNumber) {
    if (undefined === blockNumber || "latest" === blockNumber || "pending" === blockNumber) {
      return "latest";
    }
    if ("earliest" === blockNumber) {
      return 0;
    }
    if (blockNumber.startsWith("0x")) {
      return Utils.hexToInt(blockNumber);
    }
    throw new Error("Invalid block option: " + blockNumber);
  }

  _normalizeParamBlock(blockNumber) {
    return "latest" === blockNumber ? blockNumber : Utils.intToHex(blockNumber);
  }

  _clearTimer(filterId) {
    let oldTimer = this.timers.get(filterId);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }
  }

  _setupTimer(filterId) {
    this._clearTimer(filterId);
    let newTimer = setTimeout(() => {
      console.log("filter timeout ", filterId);
      this.filters.delete(filterId);
      this.blockNumbers.delete(filterId);
    }, this.timeoutInterval);
    this.timers.set(filterId, newTimer);
  }
}

module.exports = FilterMgr;
