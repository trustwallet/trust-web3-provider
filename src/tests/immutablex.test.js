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
  let provider;
  let web3;

  beforeEach(() => {
    provider = new trustwallet.ImmutableXProvider({ ethereum: goerli });
    web3 = new Web3(provider);
    jest.setTimeout(5000);
  });
    
  test("test ImmutableX constructor.name", () => {
    expect(web3.currentProvider.constructor.name).toBe("TrustImmutableXWeb3Provider");
  });

  test("test ImmutableX setAddress", () => {
    provider = new trustwallet.ImmutableXProvider({
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
      "eth_signature": "0x59ae577a76f1143a58cc8a31513ff3c3661ffec1c0fc364ec572adde30004970318036dac720e6409a3b593dc42672d51010ea9363a0f60ae6b75fde1e9df7f100",
      "stark_key": "0x05b7ef3490154934d95c02d7e53bed472bc7e954fe701d6837dc50e66c6e9e36",
      "stark_signature": "0x05b3be71fe07865c725545de6e95f7d535cf97c1566c83e3ec83bed19b6f1b8600d6b4b27ce386aeaf406474fd774d3e0688666ee59645d10689da4be90bf5ac",
    };
    
    provider = new trustwallet.ImmutableXProvider({ ethereum: mainnet });
    expect(provider.rest.basePath).toEqual("https://api.x.immutable.com");
    
    provider.setConfig({ ethereum: goerli });
    expect(provider.rest.basePath).toEqual("https://api.sandbox.x.immutable.com");
    
    // Step 1 - get encoded details to allow clients to register the user offchain
    const response = await provider.getSignableRegistration(signableRegistrationRequest);
    expect(response.signable_message).toEqual("Only sign this key linking request from Immutable X");
    expect(response.payload_hash).toEqual("3ac5f68fa5a1d969cb2b670de816f44cf79faa180911bd8a360eb3dc36d14c");

    // Step 2 - register the user
    const registerResponse = await provider.registerUser(registrationReguest);
    expect(registerResponse.tx_hash).toEqual("");
  });

  test("test ImmutableX get Stark key", async () => {
    const user = "0xe440902afc5e361e3a33152d8c67e5e07da1a524";
    const response = await provider.getUser(user);
    expect(response.accounts[0]).toEqual("0x05b7ef3490154934d95c02d7e53bed472bc7e954fe701d6837dc50e66c6e9e36");
  });

  test("test ImmutableX get tokens", async () => {
    const response = await provider.getTokens();
    expect(response.result.length).toBeGreaterThan(0);
    expect(response.cursor).toBeTruthy();
  });

  test("test ImmutableX get tokens query parameters", async () => {
    let response = await provider.getTokens(
      {
        "symbols":"IMX,ETH"
      }
    );

    expect(response.result[0].name).toEqual("Ethereum");
    expect(response.result[0].symbol).toEqual("ETH");
    expect(response.result[1].name).toEqual("Immutable X Token");
    expect(response.result[1].symbol).toEqual("IMX");

    response = await provider.getTokens(
      {
        "symbols":"IMX,ETH",
        "page_size":1
      }
    );
    
    expect(response.result.length).toEqual(1);
    expect(response.result[0].name).toEqual("Ethereum");
    expect(response.result[0].symbol).toEqual("ETH");
  });

  test("test ImmutableX get token details", async () => {
    const token = "0x4e420c0c2911e88f45d7b6f6166a7ee40c010cd6";

    const response = await provider.getTokenDetails(token);
    expect(response.name).toEqual("ApeCoin");
    expect(response.image_url).toBeTruthy();
    expect(response.symbol).toEqual("APE");
    expect(response.decimals).toEqual("18");
    expect(response.quantum).toEqual("100000000");
  });
  
  test("test ImmutableX get assets", async () => {
    const response = await provider.getAssets();
    expect(response.result.length).toBeGreaterThan(0);
    expect(response.cursor).toBeTruthy();
  });

  test("test ImmutableX get assets query parameters", async () => {
    const collectionAddress = "0x143c7913c84056a3101b78ecf4fd6f453a9dfe06";

    const response = await provider.getAssets({
      "collection": collectionAddress
    });
    expect(response.result[0].token_address).toEqual(collectionAddress);
    expect(response.remaining).toEqual(0);
  });

  test("test ImmutableX get asset details", async () => {
    const asset = "0x729731d42f95ddb7bd9c903607a3298b9835297e";
    const tokenId = "96";

    let response = await provider.getAssetDetails(asset, tokenId);
    expect(response.token_address).toEqual(asset);
    expect(response.token_id).toEqual(tokenId);
    expect(response.name).toEqual("Bored Ape 96");
    expect(response.metadata.attributes.length).toBeGreaterThan(0);
    expect(response.collection.name).toEqual("Bored Ape Club");

    response = await provider.getAssetDetails(asset, tokenId, { "include_fees": "true" });
    expect(response.fees[0].type).toEqual("protocol");
    expect(response.fees[0].percentage).toEqual(2);    
  });
  
  test("test ImmutableX get balances", async () => {
    const user = "0xe440902afc5e361e3a33152d8c67e5e07da1a524";

    let response = await provider.getBalances(user);
    let result = response.result[0];
    expect(response.remaining).toEqual(0);
    expect(response.cursor).toBeTruthy();
    expect(result.balance).toEqual('0');
    expect(result.preparing_withdrawal).toEqual('0');
    expect(result.withdrawable).toEqual('0');

    response = await provider.getBalances(user, { "direction": "desc", "page_size": 1 });
    result = response.result[0];
    expect(response.remaining).toEqual(1);
  });
  
  test("test ImmutableX get token balances", async () => {
    const provider = new trustwallet.ImmutableXProvider({ ethereum: goerli });
    const web3 = new Web3(provider);

    const user = "0xe440902afc5e361e3a33152d8c67e5e07da1a524";
    const token = "0x4e420c0c2911e88f45d7b6f6166a7ee40c010cd6";

    let response = await provider.getTokenBalances(user, "eth");
    expect(response.symbol).toEqual("ETH");
    expect(response.balance).toEqual("0");
    expect(response.preparing_withdrawal).toEqual("0");
    expect(response.withdrawable).toEqual("0");

    response = await provider.getTokenBalances(user, token);
    expect(response.symbol).toEqual("APE");
    expect(response.balance).toEqual("0");
    expect(response.preparing_withdrawal).toEqual("0");
    expect(response.withdrawable).toEqual("0");
  });

  test("test ImmutableX get collections", async () => {
    const response = await provider.getCollections();
    expect(response.result.length).toBeGreaterThan(0);
    expect(response.cursor).toBeTruthy();
  });

  test("test ImmutableX get collections query parameters", async () => {
   const response = await provider.getCollections({
      "order_by": "name",
      "page_size": 2
    });
    expect(response.result.length).toEqual(2);
  });

  test("test ImmutableX get collection details", async () => {
    const collection = "0x32e75f01d0a6c2f9227d0231dcaf3bab507f90ec";

    let response = await provider.getCollectionDetails(collection);
    expect(response.name).toEqual("Illuvitars");
    expect(response.project_id).toEqual(198);
    expect(response.project_owner_address).toEqual("0x7ff892ccec1a860a89618c5eaa3392af001f8fa3");
  });

  test("test ImmutableX get mints", async () => {
    let response = await provider.getMints();
    expect(response.result.length).toBeGreaterThan(0);
    expect(response.cursor).toBeTruthy();
    expect(response.remaining).toEqual(1);

    response = await provider.getMints({
      "order_by": "token_id",
      "page_size": 2
    });
    expect(response.result.length).toEqual(2);
  });

  test("test ImmutableX get mint details", async () => {
    const mints = await provider.getMints({ "page_size": 1 });
    const transactionId = mints.result[0].transaction_id;

    const response = await provider.getMintDetails(transactionId);
    expect(response[0].transaction_id).toEqual(transactionId);
    expect(response[0].timestamp).toBeTruthy();
    expect(response[0].token.type).toMatch( /ETH|ERC20|ERC721/ );
  });

  test("test ImmutableX get a list of primary NFT transactions", async () => {
    let response = await provider.getNftPrimarySales();
    expect(response.result.length).toBeGreaterThan(0);
    expect(response.result[0]).toHaveProperty("mint_id");
    expect(response.result[0]).toHaveProperty("mint_status");

    response = await provider.getNftPrimarySales({ "status": "completed", "direction": "desc", "page_size": 1 });
    expect(response.result[0].mint_status).toEqual("completed");
  });

  test("test ImmutableX get primary NFT transaction details", async () => {
    let response = await provider.getNftPrimarySales({ "status": "completed", "page_size": 1 });
    const transactionId = response.result[0].transaction_id;

    response = await provider.getNftPrimarySaleTransaction(transactionId);
    expect(response.transaction_id).toEqual(transactionId);
    expect(response.status).toEqual("completed");
    expect(response).toHaveProperty("contract_address");
  });
}) ;