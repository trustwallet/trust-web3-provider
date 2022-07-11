// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import { EventEmitter } from "events";

class BaseProvider extends EventEmitter {
  /**
   * @private Internal js -> native message handler
   */
  postMessage(handler, id, data) {
    let object = {
      id: id,
      name: handler,
      object: data,
    };
    if (window.trustwallet.postMessage) {
      window.trustwallet.postMessage(object);
    } else {
      console.error("postMessage is not available");
    }
  }

    /**
     * @private Internal native result -> js
     */
    sendResponse(id, result) {
      let originId = this.idMapping.tryPopId(id) || id;
      let callback = this.callbacks.get(id);
      let wrapResult = this.wrapResults.get(id);
      let data = { jsonrpc: "2.0", id: originId };
      if (
        result !== null &&
        typeof result === "object" &&
        result.jsonrpc &&
        result.result
      ) {
        data.result = result.result;
      } else {
        data.result = result;
      }
      if (this.isDebug) {
        console.log(
          `<== sendResponse id: ${id}, result: ${JSON.stringify(
            result
          )}, data: ${JSON.stringify(data)}`
        );
      }
      if (callback) {
        wrapResult ? callback(null, data) : callback(null, result);
        this.callbacks.delete(id);
      } else {
        console.log(`callback id: ${id} not found`);
        // check if it's iframe callback
        for (var i = 0; i < window.frames.length; i++) {
          const frame = window.frames[i];
          try {
            if (frame.ethereum.callbacks.has(id)) {
              frame.ethereum.sendResponse(id, result);
            }
          } catch (error) {
            console.log(`send response to frame error: ${error}`);
          }
        }
      }
    }
}

module.exports = BaseProvider;
