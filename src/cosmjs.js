"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosmJSOfflineSigner = exports.CosmJSOfflineSignerOnlyAmino = void 0;
class CosmJSOfflineSignerOnlyAmino {
    constructor(chainId, trustwallet) {
        this.chainId = chainId;
        this.trustwallet = trustwallet;
    }
    async getAccounts() {
        const key = await this.trustwallet.getKey(this.chainId);
        console.log(`==> key ${key}`);
        return [
            {
                address: key.bech32Address,
                algo: "secp256k1",
                pubkey: key.pubKey,
            },
        ];
    }
    async signAmino(signerAddress, signDoc) {
        if (this.chainId !== signDoc.chain_id) {
            throw new Error("Unmatched chain id with the offline signer");
        }
        const key = await this.trustwallet.getKey(signDoc.chain_id);
        if (key.bech32Address !== signerAddress) {
            throw new Error("Unknown signer address");
        }
        return await this.trustwallet.signAmino(this.chainId, signerAddress, signDoc, {});
    }
    async sign(signerAddress, signDoc) {
        return await this.signAmino(signerAddress, signDoc);
    }
}
exports.CosmJSOfflineSignerOnlyAmino = CosmJSOfflineSignerOnlyAmino;
class CosmJSOfflineSigner extends CosmJSOfflineSignerOnlyAmino {
    constructor(chainId, trustwallet) {
        super(chainId, trustwallet);
        this.chainId = chainId;
        this.trustwallet = trustwallet;
    }
    async signDirect(signerAddress, signDoc) {
        if (this.chainId !== signDoc.chainId) {
            throw new Error("Unmatched chain id with the offline signer");
        }
        const key = await this.trustwallet.getKey(signDoc.chainId);
        if (key.bech32Address !== signerAddress) {
            throw new Error("Unknown signer address");
        }
        return await this.trustwallet.signDirect(this.chainId, signerAddress, signDoc);
    }
}
exports.CosmJSOfflineSigner = CosmJSOfflineSigner;
