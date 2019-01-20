"use strict";

require("../index");
const Trust = window.Trust;
const Web3 = require("web3");
const config = {
  address: "0x5Ee066cc1250E367423eD4Bad3b073241612811f",
  chainId: 1,
  rpcUrl: process.env.INFURA_API_KEY ? `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}` : ""
};

describe("TrustWeb3Provider constructor tests", () => {
  test("test constructor.name", () => {
    const provider = new Trust({});
    const web3 = new Web3(provider);
    expect(web3.currentProvider.constructor.name).toBe("TrustWeb3Provider");
  });

  test("test setAddress", () => {
    const provider = new Trust({
      chainId: 1,
      rpcUrl: ""
    });
    const address = "0x5Ee066cc1250E367423eD4Bad3b073241612811f";
    expect(provider.address).toBe("");

    provider.setAddress(address);
    expect(provider.address).toBe(address.toLowerCase());
    expect(provider.ready).toBeTruthy();
  });

  test("test setConfig", done => {
    const mainnet = {
      address: "0xbE74f965AC1BAf5Cc4cB89E6782aCE5AFf5Bd4db",
      chainId: 1,
      rpcUrl: "https://mainnet.infura.io/apikey"
    };
    const ropsten = {
      address: "0xbE74f965AC1BAf5Cc4cB89E6782aCE5AFf5Bd4db",
      chainId: 3,
      rpcUrl: "https://ropsten.infura.io/apikey",
    };
    const provider = new Trust(ropsten);
    const web3 = new Web3(provider);

    expect(web3.currentProvider.chainId).toEqual(3);

    web3.currentProvider.setConfig(mainnet);
    expect(web3.currentProvider.chainId).toEqual(1);
    expect(web3.currentProvider.rpc.rpcUrl).toBe(mainnet.rpcUrl);
    expect(web3.currentProvider.filterMgr.rpc.rpcUrl).toBe(mainnet.rpcUrl);

    web3.version.getNetwork((error, id) => {
      expect(id).toBe("1");
      done();
    });
  });
});

describe("TrustWeb3Provider FilterMgr tests", () => {
  test("test normalizeFilter()", () => {
    const provider = new Trust(config);
    const web3 = new Web3(provider);
    const options = {
      "topics":[null, null, null, null],
      "address": "0x729d19f657bd0614b4985cf1d82531c67569197b",
      "fromBlock": "latest"
    };

    web3.eth.filter(options);
    const normalized = provider.filterMgr._normalizeFilter(options);

    expect(provider.filterMgr.filters.get(1)).toBeDefined();
    expect(Array.isArray(normalized.address)).toBeTruthy();
  });
});
