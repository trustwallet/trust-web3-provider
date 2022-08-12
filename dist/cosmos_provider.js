"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustCosmosWeb3Provider = void 0;
const base_provider_1 = __importDefault(require("./base_provider"));
const utils_1 = __importDefault(require("./utils"));
const error_1 = __importDefault(require("./error"));
const { CosmJSOfflineSigner, CosmJSOfflineSignerOnlyAmino } = require('./cosmjs');
class TrustCosmosWeb3Provider extends base_provider_1.default {
    constructor(config) {
        super(config);
        this.providerNetwork = "cosmos";
        this.callbacks = new Map();
        this.mode = "extension";
        this.version = "0.10.16";
        console.log(`constructor`);
    }
    enable(chainIds) {
        console.log(`==> enable for ${chainIds}`);
    }
    getOfflineSigner(chainId) {
        console.log(`==> getOfflineSigner for ${chainId}`);
        return new CosmJSOfflineSigner(chainId, this);
    }
    getOfflineSignerOnlyAmino(chainId) {
        console.log(`==> getOfflineSignerOnlyAmino for ${chainId}`);
        return new CosmJSOfflineSignerOnlyAmino(chainId, this);
    }
    getKey(chainId) {
        return this._request("requestAccounts").then((addresses) => {
            console.log(`==> received addresses ${addresses[0]}`);
            return {
                name: "",
                algo: "secp256k1",
                pubKey: addresses[0],
                address: addresses[0],
                bech32Address: addresses[0],
                isNanoLedger: false,
            };
        });
    }
    signAmino(chainId, signerAddress, signDoc) {
        return this._request("signAmino");
    }
    signDirect(chainId, signerAddress, signDoc) {
        return this._request("signDirect");
    }
    experimentalSuggestChain(chainInfo) {
        return this._request("experimentalSuggestChain", chainInfo);
    }
    _request(method, payload) {
        if (this.isDebug) {
            console.log(`==> _request method: ${method}, payload ${JSON.stringify(payload)}`);
        }
        return new Promise((resolve, reject) => {
            const id = utils_1.default.genId();
            console.log(`==> setting id ${id}`);
            this.callbacks.set(id, (error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(data);
                }
            });
            switch (method) {
                case "requestAccounts":
                    return this.postMessage("requestAccounts", id, {});
                case "experimentalSuggestChain":
                    return this.postMessage("experimentalSuggestChain", id, payload);
                default:
                    throw new error_1.default(4200, `Trust does not support calling ${payload.method} yet.`);
            }
        });
    }
}
exports.TrustCosmosWeb3Provider = TrustCosmosWeb3Provider;
module.exports = TrustCosmosWeb3Provider;
