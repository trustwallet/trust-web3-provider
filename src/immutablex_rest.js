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
   * @param {string} basePath - The base path for ImmutableX REST API endpoints. 
   */
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * GET requests.
   * @param {string} path - The path for a given ImmutableX REST endpoint.
   * @returns {object} A JSON response object.
   */
  get(path) {
    const url = this.basePath + path;
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
   * POST requests.
   * @param {string} path - The path for a given ImmutableX REST endpoint.
   * @param {object} payload - The data required by a given request.
   * @param {object} [additionalHeaders] - Additional HTTP headers.
   * @returns {object} A JSON response object.
   */
  post(path, payload, additionalHeaders={}) {
    const url = this.basePath + path;
    let headers = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
    if (Object.keys(additionalHeaders).length > 0) {
      headers = JSON.stringify(Object.assign(headers, additionalHeaders));
    }

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