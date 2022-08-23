// Copyright © 2017-2022 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import Foundation
import WebKit

public struct TrustWeb3Provider {
    public static let scriptHandlerName = "_tw_"

    public var ethereum: EthereumConfig
    public var solana: SolanaConfig
    public var cosmos: CosmosConfig

    public var providerJsUrl: URL {
        return Bundle.module.url(forResource: "trust-min", withExtension: "js")!
    }

    public var providerScript: WKUserScript {
        let source = try! String(contentsOf: providerJsUrl)
        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    }

    public var injectScript: WKUserScript {
        let source = """
        (function() {
            var config = {
                ethereum: {
                    address: "\(ethereum.address)",
                    chainId: \(ethereum.chainId),
                    rpcUrl: "\(ethereum.rpcUrl)"
                },
                solana: {
                    cluster: "\(solana.cluster)"
                },
                cosmos: {
                    chainId: "\(cosmos.chainId)"
                }
            };

            trustwallet.ethereum = new trustwallet.Provider(config);
            trustwallet.solana = new trustwallet.SolanaProvider(config);
            trustwallet.cosmos = new trustwallet.CosmosProvider(config);

            trustwallet.postMessage = (jsonString) => {
                webkit.messageHandlers._tw_.postMessage(jsonString)
            };

            window.ethereum = trustwallet.ethereum;
            window.keplr = trustwallet.cosmos;

            const getDefaultCosmosProvider = (chainId) => {
                var config = {
                    cosmos: {
                        chainId: "\(cosmos.chainId)"
                    }
                };
                trustwallet.cosmos.setConfig(config);
                return trustwallet.cosmos;
            }
            window.getOfflineSigner = getDefaultCosmosProvider;
            window.getOfflineSignerOnlyAmino = getDefaultCosmosProvider;
            window.getOfflineSignerAuto = getDefaultCosmosProvider;
        })();
        """
        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    }

    public init(ethereum: EthereumConfig, solana: SolanaConfig, cosmos: CosmosConfig) {
        self.ethereum = ethereum
        self.solana = solana
        self.cosmos = cosmos
    }
}

public struct TypeWrapper<T> {
    let value: T

    init(value: T) {
        self.value = value
    }
}

public extension WKWebView {
    var tw: TypeWrapper<WKWebView> {
        return TypeWrapper(value: self)
    }
}

public extension TypeWrapper where T == WKWebView {
    func set(network: String, address: String) {
        let script = String(format: "trustwallet.\(network).setAddress(\"%@\");", address.lowercased())
        value.evaluateJavaScript(script)
    }

    func set(ethereumConfig: EthereumConfig) {
        let script = """
        var config = {
            address: "\(ethereumConfig.address.lowercased())",
            chainId: \(ethereumConfig.chainId),
            rpcUrl: "\(ethereumConfig.rpcUrl)"
        };
        ethereum.setConfig({ethereum: config});
        """
        value.evaluateJavaScript(script)
    }

    func emitChange(chainId: Int) {
        let string = "0x" + String(chainId, radix: 16)
        let script = String(format: "trustwallet.ethereum.emitChainChanged(\"%@\");", string)
        value.evaluateJavaScript(script)
    }

    func send(network: ProviderNetwork, error: String, to id: Int64) {
        let script = String(format: "trustwallet.\(network.rawValue).sendError(%ld, \"%@\")", id, error)
        value.evaluateJavaScript(script)
    }

    func send(network: ProviderNetwork, result: String, to id: Int64) {
        let script = String(format: "trustwallet.\(network.rawValue).sendResponse(%ld, \'%@\')", id, result)
        value.evaluateJavaScript(script)
    }

    func sendNull(network: ProviderNetwork, id: Int64) {
        let script = String(format: "trustwallet.\(network.rawValue).sendResponse(%ld, null)", id)
        value.evaluateJavaScript(script)
    }

    func send(network: ProviderNetwork, results: [String], to id: Int64) {
        let array = results.map { String(format: "\"%@\"", $0) }
        let script = String(format: "trustwallet.\(network.rawValue).sendResponse(%ld, [%@])", id, array.joined(separator: ","))
        value.evaluateJavaScript(script)
    }

    func removeScriptHandler() {
        value.configuration.userContentController.removeScriptMessageHandler(forName: TrustWeb3Provider.scriptHandlerName)
    }
}

public enum ProviderNetwork: String, Decodable {
    case ethereum
    case solana
    case cosmos
}

public struct EthereumConfig {
    public let address: String
    public let chainId: Int
    public let rpcUrl: String

    public init(address: String, chainId: Int, rpcUrl: String) {
        self.address = address
        self.chainId = chainId
        self.rpcUrl = rpcUrl
    }
}

public struct SolanaConfig {
    public let cluster: String

    public init(cluster: String) {
        self.cluster = cluster
    }
}

public struct CosmosConfig {
    public let chainId: String

    public init(chainId: String) {
        self.chainId = chainId
    }
}
