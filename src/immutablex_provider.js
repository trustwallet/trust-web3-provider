// Copyright © 2017-2023 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

import { ImmutableX, Config } from "@imtbl/core-sdk";

import BaseProvider from "./base_provider";
import ImmutableXRESTServer from "./immutablex_rest";

/**
 * Trust Wallet Web3 provider for ImmutableX.
 */
class TrustImmutableXWeb3Provider extends BaseProvider {
  constructor(config) {
    super(config);
    this.setConfig(config);
    this.providerNetwork = "immutablex";
    this.callbacks = new Map();
    this.wrapResults = new Map();

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
    return new ImmutableX(config);
  }

  /**
   * @private Private internal request handler
   */
  _request(payload) {
    switch (payload.method) {
      case "getSignableRegistration":
        return this.rest.post(
          payload.path,
          payload.request
        );
      case "registerUser":
        return this.rest.post(
          payload.path,
          payload.request
        );
      case "getUser":
        return this.rest.get(payload.path)
      case "getTokens":
        return this.rest.get(payload.path);
      case "getTokenDetails":
        return this.rest.get(payload.path);
      case "getAssets":
        return this.rest.get(payload.path);
      case "getAssetDetails":
        return this.rest.get(payload.path);
      case "getBalances":
        return this.rest.get(payload.path);
      case "getTokenBalances":
        return this.rest.get(payload.path);
      case "getCollections":
        return this.rest.get(payload.path);
      case "getCollectionDetails":
        return this.rest.get(payload.path);
      default:
        break;
    }

  }

  /**
   * Get encoded details to allow registration of the user offchain.
   * @param {object} request - The user's Ethereum and Stark keys.
   *   request requires:
   *   {
   *      "ether_key": "string",
   *      "stark_key": "string",
   *   }
   * @returns {object} The request response.
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
   * @param {object} request - The data required to register an address.
   *  request requires:
   *   {
   *      "ether_key": "string",
   *      "eth_signature": "string",
   *      "stark_key": "string",
   *      "stark_signature": "string"
   *   }
   * @returns {object} The request response.
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
   * @param {string} user - The Ethereum address of the user.
   * @returns {object} The request response.
   */
  getUser(user) {
    const payload = {
      method: "getUser",
      path: `/v1/users/${user}`
    };
    return this._request(payload);
  }

  /**
   * Gets a list of tokens.
   * @returns {object} The request response.
   */
  getTokens() {
    const payload = {
      method: "getTokens",
      path: "/v1/tokens"
    };
    return this._request(payload);
  }
  
  /**
   * Get the details for a given token.
   * @param {string} token - The token contract address
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
   * @returns The request response.
   */
  getAssets() {
    const payload = {
      method: "getAssets",
      path: "/v1/assets"
    };
    return this._request(payload);
  }
  
  /**
   * Get the details for a given asset.
   * @param {string} asset - The address of the ERC721 contract.
   * @param {string} tokenId - Either ERC721 token ID or internal IMX ID.
   * @returns {object} The request response.
   */
  getAssetDetails(asset, tokenId) {
    const payload = {
      method: "getAssetDetails",
      path: `/v1/assets/${asset}/${tokenId}`
    };
    return this._request(payload);
  }
  
  /**
   * Get a list of balances for a given user.
   * @param {string} user - The Ethereum address of the user.
   * @returns {object} The request response.
   */
  getBalances(user) {
    // NOTE: /v1/balances is deprecated
    const payload = {
      method: "getBalances",
      path: `/v2/balances/${user}`
    };
    return this._request(payload);
  }
  
  /**
   * Get the balance for a given user of a given token.
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
   * @returns {object} The request response.
   */
  getCollections() {
    const payload = {
      method: "getCollections",
      path: "/v1/collections"
    };
    return this._request(payload);
  }

  /**
   * Get the details for a given collection. 
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
   * 
   * @param {string} chainId 
   */
  emitConnect(chainId) {
    this.emit("connect", { chainId: chainId });
  }
}

module.exports = TrustImmutableXWeb3Provider;