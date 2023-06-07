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
   * Get encoded details to allow registration of the user offchain
   * @param {object} payload - The user's ethereum and stark addresses
   * @returns {object}  
   */
  getSignableRegistration(payload) {    
    // Payload requires:
    // {
    //   "ether_key": "string",
    //   "stark_key": "string",
    // }
    const url = this.url + "/v1/signable-registration-offchain";
    const headers = { "Content-Type": "application/json" };
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
   * @returns {object} The registerUser request response.
   */
  registerUser(payload) {
    // Payload requires:
    // {
    //   "eth_signature": "string",
    //   "ether_key": "string",
    //   "stark_key": "string",
    //   "stark_signature": "string"
    // }
    const url = this.url + "/v1/users";
    const headers = { "Content-Type": "application/json" };
    const response = this._post(
      url, 
      headers, 
      payload
    );
    return response;
  }

  /**
   * Gets Stark keys for a given registered user
   */
  getStartKeys() {}

  /**
   * Gets a list of tokens
   */
  getTokens() {}
  
  /**
   * Get the details for a given token
   */
  getTokenDetails() {}

  /**
   * Get a list of collections
   */
  getCollections() {}

  /**
   * Get the details for a given collection
   */
  getCollectionDetails() {}

  /**
   * Get a user's Ether balance in WEI
   */
  getBalance() {}

  /**
   * Get the token balances for a given user
   */
  getTokenBalances() {}
  
  /**
   * @private Private method for HTTP GET requests
   * @param {string} url - URL for a given request
   * @returns {object} A JSON response object
   */
  _get(url) {
    return fetch(
      url, 
      {
        method: "GET",
        headers: {
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
   * @private Private method for HTTP POST requests
   * @param {string} url - URL for a given REST endpoint
   * @param {object} headers - HTTP headers
   * @param {object} payload - The data required by a given request
   * @returns {object} A JSON response object
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