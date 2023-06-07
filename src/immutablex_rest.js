// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

/**
 * Class to simplify interaction with the ImmutableX REST API.
 */
class ImmutableXRESTServer {
  /**
   * @param {string} url - The base path for ImmutableX REST API endpoints. 
   */
  constructor(url) {
    this.url = url;
  }

  /**
   * Get encoded details to allow registration of the user offchain.
   * @param {object} payload - The user's ethereum and stark addresses.
   * @returns {object} The request response.
   */
  getSignableRegistration(payload) {    
    // Payload requires:
    // {
    //   "ether_key": "string",
    //   "stark_key": "string",
    // }
    const url = `${this.url}/v1/signable-registration-offchain`;
    const headers = { 
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
    const response = this._post(
      url,
      headers,
      payload
    );
    return response;
  }

  /**
   * Registers a user's addresses with ImmutableX.
   * @param {object} payload - The data required to register an address.
   * @returns {object} The request response.
   */
  registerUser(payload) {
    // Payload requires:
    // {
    //   "eth_signature": "string",
    //   "ether_key": "string",
    //   "stark_key": "string",
    //   "stark_signature": "string"
    // }
    const url = `${this.url}/v1/users`;
    const headers = { 
      "Accept": "application/json",
      "Content-Type": "application/json" 
    };
    const response = this._post(
      url, 
      headers, 
      payload
    );
    return response;
  }

  /**
   * Gets Stark keys for a given registered user.
   * @param {string} - The Ethereum address of the user.
   * @returns {object} The request response.
   */
  getStarkKey(user) {
    const url = `${this.url}/v1/users/${user}`;
    const response = this._get(url);
    return response;
  }

  /**
   * Gets a list of tokens.
   * @returns {object} The request response.
   */
  getTokens() {
    const url = `${this.url}/v1/tokens`;
    const response = this._get(url);
    return response;
  }
  
  /**
   * Get the details for a given token.
   * @param {string} - The address of the token
   * @returns {object} The request response.
   */
  getTokenDetails(token) {
    const url = `${this.url}/v1/tokens/${token}`;
    const response = this._get(url);
    return response;
  }

  /**
   * Get a list of assets.
   * @returns The request response.
   */
  getAssets() {
    const url = `${this.url}/v1/assets`;
    const response = this._get(url);
    return response;
  }

  /**
   * Get the details for a given asset.
   * @param {string} - The address of the asset.
   * @returns {object} The request response.
   */
  getAssetDetails(asset, tokenId) {
    const url = `${this.url}/v1/assets/${asset}/${tokenId}`;
    const response = this._get(url);
    return response;
  }

  /**
   * Get a list of collections.
   */
  getCollections() {}

  /**
   * Get the details for a given collection.
   */
  getCollectionDetails() {}

  /**
   * Get a user's Ether balance in WEI.
   * @param {string} - The Ethereum address of the user.
   * @returns {object} The request response.
   */
  getBalances(user) {
    // NOTE: /v1/balances is deprecated
    const url = `${this.url}/v2/balances/${user}`;
    const response = this._get(url);
    return response;
  }

  /**
   * Get the balances for a given user of a given token.
   * @param {string} - The Ethereum address of the user.
   * @param {string} - The address of the token contract.
   */
  getTokenBalances(user, token) {
    const url = `${this.url}/v2/balances/${user}/${token}`
    const response = this._get(url);
    return response;
  }
  
  /**
   * @private Private method for HTTP GET requests.
   * @param {string} url - URL for a given REST endpoint.
   * @returns {object} A JSON response object.
   */
  _get(url) {
    return fetch(
      url, 
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      }
    )
    .then(response => response.json())
    .then(json => {
      if (!json.result && json.error) {
        console.log("<== REST api error", json.error);
        throw new Error(json.error.message || "REST api error");
      }
      return json;
    });
  }

  /**
   * @private Private method for HTTP POST requests.
   * @param {string} url - URL for a given REST endpoint.
   * @param {object} headers - HTTP headers.
   * @param {object} payload - The data required by a given request.
   * @returns {object} A JSON response object.
   */
  _post(url, headers, payload) {
    return fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(json => {
      if (!json.result && json.error) {
        console.log("<== REST api error", json.error);
        throw new Error(json.error.message || "REST api error");
      }
      return json;
    });
  }
}

module.exports = ImmutableXRESTServer;