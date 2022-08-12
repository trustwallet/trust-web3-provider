"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class BaseProvider extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.isDebug = !!config.isDebug;
        this.isTrust = true;
    }
    postMessage(handler, id, data) {
        let object = {
            id: id,
            name: handler,
            object: data,
            network: this.providerNetwork,
        };
        if (window.trustwallet.postMessage) {
            window.trustwallet.postMessage(object);
        }
        else {
            console.error("postMessage is not available");
        }
    }
    sendResponse(id, result) {
        let callback = this.callbacks.get(id);
        if (this.isDebug) {
            console.log(`<== sendResponse id: ${id}, result: ${JSON.stringify(result)}`);
        }
        if (callback) {
            callback(null, result);
            this.callbacks.delete(id);
        }
        else {
            console.log(`callback id: ${id} not found`);
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
module.exports = BaseProvider;
