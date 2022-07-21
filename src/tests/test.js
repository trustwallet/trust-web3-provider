// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

"use strict";

require("../index");
require("whatwg-fetch");
const ethUtil = require("ethereumjs-util");
const Web3 = require("web3");
const trustwallet = window.trustwallet;

const mainnet = {
  address: "0x9d8A62f656a8d1615C1294fd71e9CFb3E4855A4F",
  chainId: 1,
  rpcUrl: "https://mainnet.infura.io/v3/<key>",
};

const ropsten = {
  address: "0x9d8A62f656a8d1615C1294fd71e9CFb3E4855A4F",
  chainId: 3,
  rpcUrl: "https://ropsten.infura.io/apikey",
};

const bsc = {
  address: "0x9d8A62f656a8d1615C1294fd71e9CFb3E4855A4F",
  chainId: 56,
  rpcUrl: "https://bsc-dataseed1.binance.org",
};

describe("TrustWeb3Provider constructor tests", () => {
  test("test constructor.name", () => {
    const provider = new trustwallet.Provider({ethereum: {}});
    const web3 = new Web3(provider);
    expect(web3.currentProvider.constructor.name).toBe("TrustWeb3Provider");
  });

  test("test Ethereum setAddress", () => {
    const provider = new trustwallet.Provider({
      ethereum:{
        chainId: 1,
        rpcUrl: "",
        isMetaMask: false,
    }});
    const address = mainnet.address;
    expect(provider.address).toBe("");
    expect(provider.isMetaMask).toBeFalsy();

    provider.setAddress(address);
    expect(provider.address).toBe(address.toLowerCase());
    expect(provider.ready).toBeTruthy();
  });

  test("test Solana setAddress", () => {
    const provider = new trustwallet.SolanaProvider({
      solana: {
        cluster: "mainnet-beta",
        isPhantom: false,
      },
      isDebug: true
    });
    expect(provider.publicKey).toBe(null);
    expect(provider.isDebug).toBeTruthy();
    expect(provider.isTrust).toBeTruthy();
    expect(provider.isPhantom).toBeFalsy();

    const publicKey = "8gP4CUuPG2Dv5iGyvNmnitBMydLvCLKb8jWH6fME1SWH";
    provider.setAddress(publicKey);
    expect(provider.publicKey.toString()).toBe(publicKey);

    provider.disconnect().then(() => {
      expect(provider.publicKey).toBe(null);
    });
  });

  test("test setConfig", (done) => {
    const provider = new trustwallet.Provider({ethereum: ropsten});
    const web3 = new Web3(provider);

    expect(web3.currentProvider.chainId).toEqual("0x3");
    expect(web3.currentProvider.networkVersion).toEqual("3");

    web3.currentProvider.setConfig({ethereum: mainnet});
    expect(web3.currentProvider.chainId).toEqual("0x1");
    expect(web3.currentProvider.networkVersion).toEqual("1");
    expect(web3.currentProvider.rpc.rpcUrl).toBe(mainnet.rpcUrl);

    expect(provider.request).not.toBeUndefined;
    expect(provider.on).not.toBeUndefined;

    web3.version.getNetwork((error, id) => {
      expect(id).toBe("1");
      done();
    });
  });

  test("test eth_chainId", (done) => {
    const provider = new trustwallet.Provider({ethereum: bsc});
    const web3 = new Web3(provider);

    let request = { jsonrpc: "2.0", method: "eth_chainId", id: 123 };

    provider.request(request).then((chainId) => {
      expect(chainId).toEqual("0x38");
    });

    const response = web3.currentProvider.send(request);
    expect(response.result).toBe("0x38");

    web3.currentProvider.sendAsync(request, (error, result) => {
      expect(result.result).toEqual("0x38");
      done();
    });
  });

  test("test eth_accounts", (done) => {
    const provider = new trustwallet.Provider({ethereum: mainnet});
    const web3 = new Web3(provider);
    const addresses = ["0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f"];

    web3.eth.getAccounts((error, accounts) => {
      expect(accounts).toEqual(addresses);
    });

    provider.request({ method: "eth_accounts" }).then((accounts) => {
      expect(accounts).toEqual(addresses);
    });

    web3.currentProvider.sendAsync(
      { method: "eth_accounts" },
      (error, data) => {
        expect(data.result).toEqual(addresses);
        done();
      }
    );
  });

  test("test eth_sign", (done) => {
    const provider = new trustwallet.Provider({ethereum: mainnet});
    const web3 = new Web3(provider);
    const addresses = ["0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f"];
    const signed =
      "0x730ec377cfc7090e08366fad4758aad721dbb51e187efe45426a7e56d1ff053947ab1a7b0bd7b138c48a9f3d3b92bd83f4265abbe9876930faaf7fbb980b219d1c";

    trustwallet.postMessage = (message) => {
      provider.sendResponse(message.id, signed);
    };

    var hash = ethUtil.keccak256(
      Buffer.from("An amazing message, for use with MetaMask!", "utf8")
    );
    var hex = "0x" + hash.toString("hex");
    web3.eth.sign(addresses[0], hex, (err, result) => {
      expect(result).toEqual(signed);
      done();
    });
  });

  test("test personal_sign", (done) => {
    const provider = new trustwallet.Provider({ethereum: bsc});
    const signed =
      "0xf3a9e21a3238b025b7edf5013876548cfb2f2a838aca573de88c91ea9aecf7190cd6330a0172bd5d106841647831f30065f644eddc2f86091e1bb370c9ff833f1c";

    trustwallet.postMessage = (message) => {
      const buffer = Buffer.from(message.object.data);
      if (buffer.length === 0) {
        throw new Error("message is not hex!");
      }
      provider.sendResponse(message.id, signed);
    };

    const request = {
      method: "personal_sign",
      params: [
        "{\"version\":\"0.1.2\",\"timestamp\":\"1602823075\",\"token\":\"0x4b0f1812e5df2a09796481ff14017e6005508003\",\"type\":\"vote\",\"payload\":{\"proposal\":\"QmSV53XuYi28XfdNHDhBVp2ZQwzeewQNBcaDedRi9PC6eY\",\"choice\":1,\"metadata\":{}}}",
        "0x9d8A62f656a8d1615C1294fd71e9CFb3E4855A4F",
      ],
      id: 1602823075454,
    };

    expect(Buffer.from(request.params[0], "hex").length).toEqual(0);

    provider.request(request).then((result) => {
      expect(result).toEqual(signed);
      done();
    });
  });

  test("test eth_signTypedData_v4", (done) => {
    const provider = new trustwallet.Provider({ethereum: mainnet});
    const signed =
      "0x7aff0e37900fc2eb5e78c56b07246a0904b3ba642cab17917d7524110b83fe04296790ff076a7dd31b2a11ded9fcbe3959fe872b7c18fa79f5146807855fcce41b";

    trustwallet.postMessage = (message) => {
      provider.sendResponse(message.id, signed);
    };

    const request = require("./eth_signTypedData_v4.json");

    provider.request(request).then((result) => {
      expect(result).toEqual(signed);
      done();
    });
  });

  test("test batched sendAsync", (done) => {
    const provider = new trustwallet.Provider({ethereum: bsc});
    const web3 = new Web3(provider);
    const request = [
      {jsonrpc: "2.0", id: 11, method: "eth_call", params: [{data: "0x06fdde03", to: "0xe9e7cea3dedca5984780bafc599bd69add087d56"}, "latest"]},
      {jsonrpc: "2.0", id: 12, method: "eth_call", params: [{data: "0x313ce567", to: "0xe9e7cea3dedca5984780bafc599bd69add087d56"}, "latest"]}
    ];
    const expectedResult = [
      {
        jsonrpc: "2.0",
        id: 11,
        result: "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a4255534420546f6b656e00000000000000000000000000000000000000000000"
      },
      {
        jsonrpc: "2.0",
        id: 12,
        result: "0x0000000000000000000000000000000000000000000000000000000000000012"
      }
    ];
    web3.currentProvider.sendAsync(request,
      (error, result) => {
        expect(result).toEqual(expectedResult);
        done();
      }
    );
  });
}); // end of top describe()
