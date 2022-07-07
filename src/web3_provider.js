// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import Utils from "./utils";
import ProviderRpcError from "./error";
import { EventEmitter } from "events";
import isUtf8 from "isutf8";

class TrustWeb3Provider extends EventEmitter {
    processMessage(payload) {
        const buffer = Utils.messageToBuffer(payload);
        const hex = Utils.bufferToHex(buffer);
        if (isUtf8(buffer)) {
            this.postMessage("signPersonalMessage", 0, { data: hex });
        } else {
            this.postMessage("signMessage", 0, { data: hex });
        }
    }
    /**
     * @private Internal js -> native message handler
     */
    postMessage(handler, id, data) {
      if (this.ready) {
        let object = {
          id: id,
          name: handler,
          object: data,
        };
        if (window.trustwallet.postMessage) {
          window.trustwallet.postMessage(object);
        } else {
          // old clients
          window.webkit.messageHandlers[handler].postMessage(object);
        }
      } else {
        // don't forget to verify in the app
        this.sendError(id, new ProviderRpcError(4100, "provider is not ready"));
      }
    }
}

module.exports = TrustWeb3Provider;
