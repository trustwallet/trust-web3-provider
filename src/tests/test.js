"use strict";

require("../index");
var Trust = window.Trust;
var Web3 = require("web3");

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

    web3.version.getNetwork((error, id) => {
      expect(id).toBe("1");
      done();
    });
  });
});
