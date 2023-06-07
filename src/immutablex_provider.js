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
    this.providerNetwork = "ethereum";
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

  emitConnect(chainId) {
    this.emit("connect", { chainId: chainId });
  }
}

module.exports = TrustImmutableXWeb3Provider;