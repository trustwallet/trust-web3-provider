// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

require("../index");
require("whatwg-fetch");
// const ethUtil = require("ethereumjs-util");

const Web3 = require("web3");

const trustwallet = window.trustwallet;

const mainnet = {
  address: "0xE440902aFC5e361E3A33152D8c67E5E07dA1A524",
  chainId: 1,
};

const goerli = {
  address: "0xE440902aFC5e361E3A33152D8c67E5E07dA1A524",
  chainId: 5,
}

// const ethKey = "0xe440902afc5e361e3a33152d8c67e5e07da1a524";
// const starkKey = "0x05b7ef3490154934d95c02d7e53bed472bc7e954fe701d6837dc50e66c6e9e36";
// const signature = "0x32c32bf7229342179dc3f13f716f7d4fdaf3b67afbecf18d5ddb1a6adeebeee654f9b3e17c0fda98e6369fcb991a7f57fca36e061805c5a2c817619902f190541c";

describe("TrustImmutableXWeb3Provider tests", () => {
  
  test("test ImmutableX constructor.name", () => {
    const provider = new trustwallet.ImmutableXProvider({ ethereum: {} });
    const web3 = new Web3(provider);
    expect(web3.currentProvider.constructor.name).toBe("TrustImmutableXWeb3Provider");
  });

  test("test ImmutableX setAddress", () => {
    const provider = new trustwallet.ImmutableXProvider({
      ethereum: {
        chainId: 1,
        isMetaMask: false,
      },
    });
    const address = mainnet.address;
    expect(provider.ethAddress).toBe("");
    expect(provider.isMetaMask).toBeFalsy();

    provider.setAddress(address);
    expect(provider.ethAddress).toBe(address.toLowerCase());
    expect(provider.ready).toBeTruthy();    
  });
  
  test("test ImmutableX setConfig", () => {
    const provider = new trustwallet.ImmutableXProvider({ ethereum: goerli });
    const web3 = new Web3(provider);
    
    expect(web3.currentProvider.chainId).toEqual("0x5");
    expect(web3.currentProvider.networkVersion).toEqual("5");
    
    web3.currentProvider.setConfig({ ethereum: mainnet });
    expect(web3.currentProvider.chainId).toEqual("0x1");
    expect(web3.currentProvider.networkVersion).toEqual("1");
    
    expect(provider.request).not.toBeUndefined;
    expect(provider.on).not.toBeUndefined;
  });

  test("test ImmutableX register user", async () => {
    const signableRegistrationRequest = {
      "ether_key": "0xe440902afc5e361e3a33152d8c67e5e07da1a524",
      "stark_key": "0x05b7ef3490154934d95c02d7e53bed472bc7e954fe701d6837dc50e66c6e9e36",
    };

    const registrationReguest = {
      "ether_key": "0xe440902afc5e361e3a33152d8c67e5e07da1a524",
      "eth_signature": "",
      "stark_key": "0x05b7ef3490154934d95c02d7e53bed472bc7e954fe701d6837dc50e66c6e9e36",
      "stark_signature": "",
    };
    
    const provider = new trustwallet.ImmutableXProvider({ ethereum: mainnet });
    expect(provider.rest.url).toEqual("https://api.x.immutable.com");
    
    provider.setConfig({ ethereum: goerli });
    expect(provider.rest.url).toEqual("https://api.sandbox.x.immutable.com");
    
    
    // Step 1 - get encoded details to allow clients to register the user offchain
    const response = await provider.rest.getSignableRegistration(signableRegistrationRequest);
    expect (response.signable_message).toEqual("Only sign this key linking request from Immutable X");
    expect(response.payload_hash).toEqual("3ac5f68fa5a1d969cb2b670de816f44cf79faa180911bd8a360eb3dc36d14c");

    // Step 2 - register the user
    // const registerResponse = await provider.rest.registerUser(registrationReguest);
    // expect (registerResponse.tx_hash).toBeTruthy();
  });
}) ;