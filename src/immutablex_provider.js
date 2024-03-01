// Copyright © 2017-2023 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import { ImmutableX, Config } from "@imtbl/core-sdk";

import BaseProvider from "./base_provider";
import ImmutableXRESTServer from "./immutablex_rest";
import ProviderRpcError from "./error";

/**
 * Trust Wallet Web3 provider for ImmutableX.
 */
class TrustImmutableXWeb3Provider extends BaseProvider {

  /**
   * Constructor.
   * @param {object} config - Provider configuration.
   * @emits connect
   */
  constructor(config) {
    super(config);
    this.setConfig(config);
    this.providerNetwork = "immutablex";
    this.emitConnect(this.chainId);
  }

  /**
   * Sets the Ethereum account address to be used with the provider.
   * @param {string} address - Ethreum address connected with the ImmutableX user.
   */
  setAddress(address) {
    const lowerAddress = (address || "").toLowerCase();
    this.ethAddress = lowerAddress;
    this.ready = !!address;
    try {
      for (var i = 0; i < window.frames.length; i++) {
        const frame = window.frames[i];
        if (frame.ethereum && frame.ethereum.isTrust) {
          frame.ethereum.address = lowerAddress;
          frame.ethereum.ready = !!address;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Sets the Stark address registered to the Ethereum address.
   * @param {string} address - The Stark address registered to the users's Ethereum address.
   */
  setStarkAddress(address) {
    const lowerAddress = (address || "").toLowerCase();
    this.starkAddress = lowerAddress;
  }

  /**
   * Configure the provider.
   * @param {object} config - Provider configuration object.
   */
  setConfig(config) {
    this.setAddress(config.ethereum.address);
    this.networkVersion = "" + config.ethereum.chainId;
    this.chainId = "0x" + (config.ethereum.chainId || 1).toString(16);
    this.imtblClient = this.init();
    // ImmutableX API URL base path
    // https://api.sandbox.x.immutable.com - testnet
    // https://api.x.immutable.com - mainnet
    this.rest = new ImmutableXRESTServer(this.basePath);
    this.isDebug = !!config.isDebug;
  }

  /**
   * Initialises the ImmutableX client.
   * @returns {ImmutableX} The ImmutableX client.
   */
  init() {
    // Initialize ImmutableX client based on the Ethereum network (mainnet | testnet)
    // The testnet currently used is Goerli 
    let config;
    if (this.chainId == "0x1") { 
      // Ethereum mainnet
      config = Config.PRODUCTION;
    } else { 
      // Ethereum testnet (currently Goerli)
      config = Config.SANDBOX;
    }
    // Set the base path for the ImmutableX REST endpoints
    this.basePath = config.apiConfiguration.basePath;
    this.imtblConfig = config;
    return new ImmutableX(config);
  }

  /**
   * @private Private internal request handler.
   * @param {object} - The request payload.
   */
  _request(payload) {
    switch (payload.method) {
      case "getSignableRegistration":
      case "registerUser":
      case "getSignableDeposit":
      case "getSignableWithdrawal":
        return this.rest.post(
          payload.path,
          payload.request
        );
      case "getStarkKeys":
      case "getTokens":
      case "getTokenDetails":
      case "getAssets":
      case "getAssetDetails":
      case "getBalances":
      case "getTokenBalances":
      case "getCollections":
      case "getCollectionDetails":
      case "getMints":
      case "getMintDetails":
      case "getNftPrimarySales":
      case "getNftPrimarySaleTransaction":
        return this.rest.get(payload.path);
      default:
        // Throw error for unsupported method
        throw new ProviderRpcError(
          4200,
          `Trust does not support calling ${payload.method} yet.`
        );
    }
  }

  /**
   * Get encoded details to allow registration of the user offchain.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getSignableRegistrationOffchain}
   * @param {object} request - The user's Ethereum and Stark keys:
   *   {
   *      "ether_key": "string",
   *      "stark_key": "string",
   *   }
   * @returns {object} The request response:
   *   {
   *     "payload_hash": "string",
   *     "signable_message": "string"
   *   }
   * 
   *   When registering a user on ImmutableX:
   * 
   *   - The payload_hash must be signed by the user's Stark key.
   * 
   *   - The signable_message must be signed by the user's Ethereum key.
   */
  getSignableRegistration(request) {
    const payload = {
      method: "getSignableRegistration",
      path: "/v1/signable-registration-offchain",
      request: request
    };
    return this._request(payload);
  }

  /**
   * Registers a user's addresses with ImmutableX.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/registerUser}
   * @param {object} request - The data required to register an address:
   *   {
   *      "ether_key": "string",
   *      "eth_signature": "string",
   *      "stark_key": "string",
   *      "stark_signature": "string"
   *   }
   * @returns {object} The request response:
   *   {
   *      "tx_hash": "string"
   *   }
   * 
   *   Note: Returns an empty string if the user is already registered.
   */
  registerUser(request) {
    const payload = {
      method: "registerUser",
      path: "/v1/users",
      request: request
    };
    return this._request(payload);
  }
  
  /**
   * Gets Stark keys for a given registered user.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/registerUser}
   * @param {string} user - The Ethereum address of the user.
   * @returns {object} The request response.
   *   { 
   *     "accounts": [
   *       "string"
   *     ]
   *   }
   */
  getStarkKeys(user) {
    const payload = {
      method: "getStarkKeys",
      path: `/v1/users/${user}`
    };
    return this._request(payload);
  }

  /**
   * Gets details of a signable deposit.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getSignableDeposit}
   * @param {object} request - Details of the signable deposit:
   *   {
   *     "amount": "string",
   *     "token": {
   *       "data": null,
   *       "type": "ETH | ERC20 | ERC721"
   *     },
   *     "user": "string"
   *   }
   * @returns {object} The request response:
   *   {
   *     "amount": "string",
   *     "asset_id": "string",
   *     "nonce": 0,
   *     "stark_key": "string",
   *     "vault_id": 0
   *   }
   */
  getSignableDeposit(request) {
    const payload = {
      method: "getSignableDeposit",
      path: "/v1/signable-deposit-details",
      request: request
    };
    return this._request(payload);
  }

  /**
   * Gets details of a signable withdrawal.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getSignableWithdrawal}
   * @param {object} request - Details of the signable withdrawal:
   *   {
   *     "amount": "string",
   *     "token": {
   *       "data": null,
   *       "type": "ETH | ERC20 | ERC721"
   *     },
   *     "user": "string"
   *   }
   * @returns {object} The request response:
   *   {
   *     "amount": "string",
   *     "asset_id": "string",
   *     "nonce": 0,
   *     "payload_hash": "string",
   *     "readable_transaction": "string",
   *     "signable_message": "string",
   *     "stark_key": "string",
   *     "vault_id": 0,
   *     "verification_signature": "string"
   *   }
   */
  getSignableWithdrawal(request) {
    const payload = {
      method: "getSignableWithdrawal",
      path: "/v1/signable-withdrawal-details",
      request: request
    };
    return this._request(payload);
  }

  /**
   * Gets a list of tokens.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/listTokens}
   * @param {object} params - Optional query parameters.
   * @returns {object} The request response.
   */
  getTokens(params = {}) {
    let path = "/v1/tokens";

    // Construct path with query parameters if supplied
    const queryParams = new URLSearchParams(params).toString();
    if (Object.keys(params).length > 0) {
      path = path + `?${queryParams}`;
    }
    
    const payload = {
      method: "getTokens",
      path: path,

    };
    return this._request(payload);
  }
  
  /**
   * Get the details for a given token.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getToken}
   * @param {string} token - The token contract address.
   * @returns {object} The request response.
   */
  getTokenDetails(token) {
    const payload = {
      method: "getTokenDetails",
      path: `/v1/tokens/${token}`
    };
    return this._request(payload);
  }

  /**
   * Get a list of assets.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/listAssets}
   * @param {object} params - Optional query parameters.
   * @returns The request response.
   */
  getAssets(params = {}) {
    let path = "/v1/assets";

    // Construct path with query parameters if supplied
    const queryParams = new URLSearchParams(params).toString();
    if (Object.keys(params).length > 0) {
      path = path + `?${queryParams}`;
    }

    const payload = {
      method: "getAssets",
      path: path
    };
    return this._request(payload);
  }
  
  /**
   * Get the details for a given asset.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getAsset}
   * @param {string} asset - The address of the ERC721 contract.
   * @param {string} tokenId - Either ERC721 token ID or internal IMX ID.
   * @param {object} params - Optional query parameters.
   * @returns {object} The request response.
   */
  getAssetDetails(asset, tokenId, params = {}) {
    let path = `/v1/assets/${asset}/${tokenId}`;

    // Construct path with query parameters if supplied
    const queryParams = new URLSearchParams(params).toString();
    if (Object.keys(params).length > 0) {
      path = path + `?${queryParams}`;
    }

    const payload = {
      method: "getAssetDetails",
      path: path
    };
    return this._request(payload);
  }
  
  /**
   * Get a list of balances for a given user.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/listBalances}
   * @param {string} user - The Ethereum address of the user.
   * @param {object} params - Optional query parameters.
   * @returns {object} The request response.
   */
  getBalances(user, params = {}) {
    // NOTE: /v1/balances is deprecated
    let path = `/v2/balances/${user}`

    // Construct path with query parameters if supplied
    const queryParams = new URLSearchParams(params).toString();
    if (Object.keys(params).length > 0) {
      path = path + `?${queryParams}`;
    }

    const payload = {
      method: "getBalances",
      path: path
    };
    return this._request(payload);
  }
  
  /**
   * Get the balance for a given user of a given token.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getBalance}
   * @param {string} user - The Ethereum address of the user.
   * @param {string} token - The address of the token contract or 'eth'.
   * @returns {object} The request resppnse.
   */
  getTokenBalances(user, token) {
    const payload = {
      method: "getTokenBalances",
      path: `/v2/balances/${user}/${token}`
    };
    return this._request(payload);
  }

  /**
   * Get a list of collections.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/listCollections}
   * @param {object} params - Optional query parameters.
   * @returns {object} The request response.
   */
  getCollections(params = {}) {
    let path = "/v1/collections";

    // Construct path with query parameters if supplied
    const queryParams = new URLSearchParams(params).toString();
    if (Object.keys(params).length > 0) {
      path = path + `?${queryParams}`;
    }

    const payload = {
      method: "getCollections",
      path: path
    };
    return this._request(payload);
  }

  /**
   * Get the details for a given collection.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getCollection}
   * @param {string} collection - Collection contract address.
   * @returns {object} The request response.
   */
  getCollectionDetails(collection) {
    const payload = {
      method: "getCollectionDetails",
      path: `/v1/collections/${collection}`
    }
    return this._request(payload);
  }

  /**
   * Get information about token mints.
   * Use getAssets() for information about tokens that have already been minted.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/listMints}
   * @param {object} params - Optional query parameters.
   * @returns {object} The request response.
   */
  getMints(params = {}) {
    let path = "/v1/mints";

    // Construct path with query parameters if supplied
    const queryParams = new URLSearchParams(params).toString();
    if (Object.keys(params).length > 0) {
      path = path + `?${queryParams}`;
    }

    const payload = {
      method: "getMints",
      path: path
    };
    return this._request(payload);
  }

  /**
   * Get the details for a mint with a given ID.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getMint}
   * @param {string} mintId - The mint transaction id (returned from getMints).
   * @returns {object} The request response.
   */
  getMintDetails(mintId) {
    const payload = {
      method: "getMintDetails",
      path: `/v1/mints/${mintId}`
    }
    return this._request(payload);
  }

  /**
   * Get a list of NFT primary sales transactions.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getNftPrimaryTransactions}
   * @param {object} params - Optional query parameters.
   * @returns {object} The request response.
   */
  getNftPrimarySales(params = {}) {
    let path = "/v2/nft/primary"

    // Construct path with query parameters if supplied
    const queryParams = new URLSearchParams(params).toString();
    if (Object.keys(params).length > 0) {
      path = path + `?${queryParams}`;
    }

    const payload = {
      method: "getNftPrimarySales",
      path: path
    }
    return this._request(payload);
  }

  /**
   * Get transaction information for a given NFT transaction ID.
   * @see {@link https://docs.x.immutable.com/reference/#/operations/getNftPrimaryTransaction}
   * @param {string} transactionId - The sale transaction ID (returned from getNftPrimarySales).
   * @returns {object} The request response.
   */
  getNftPrimarySaleTransaction(transactionId) {
    const payload = {
      method: "getNftPrimarySaleTransaction",
      path: `/v2/nft/primary/${transactionId}`
    }
    return this._request(payload);
  }

  /**
   * Gets the ImmutableX core contract address for the connected network
   * @returns {string} The address of the ImmutableX core contract
   */
  getCoreContractAddress() {
    return this.imtblConfig.ethConfiguration.coreContractAddress;
  }

  /**
   * Get an timestamp required with IMX-Timestamp Header/Params.
   * @returns {string} Timestamp.
   */
  getIMXTimestamp() {
    return Math.floor(Date.now() / 1000).toString();
  }
  
  /**
   * Emit `connect` event.
   * @param {string} chainId - The chain ID of the network.
   */
  emitConnect(chainId) {
    this.emit("connect", { chainId: chainId });
  }
}

module.exports = TrustImmutableXWeb3Provider;