// Copyright © 2017-2022 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import Foundation
import WebKit

public struct TrustWeb3Provider {
    public struct Config: Equatable {
        public let ethereum: EthereumConfig
        public let solana: SolanaConfig
        public let aptos: AptosConfig

        public init(
            ethereum: EthereumConfig,
            solana: SolanaConfig = SolanaConfig(cluster: "https://api.mainnet-beta.solana.com"),
            aptos: AptosConfig = AptosConfig(network: "Mainnet", chainId: "1")
        ) {
            self.ethereum = ethereum
            self.solana = solana
            self.aptos = aptos
        }

        public struct EthereumConfig: Equatable {
            public let address: String
            public let chainId: Int
            public let rpcUrl: String

            public init(address: String, chainId: Int, rpcUrl: String) {
                self.address = address
                self.chainId = chainId
                self.rpcUrl = rpcUrl
            }
        }

        public struct SolanaConfig: Equatable {
            public let cluster: String

            public init(cluster: String) {
                self.cluster = cluster
            }
        }

        public struct AptosConfig: Equatable {
            public let network: String
            public let chainId: String

            public init(network: String, chainId: String) {
                self.network = network
                self.chainId = chainId
            }
        }
    }

    private class dummy {}
    private let filename = "trust-min"    
    public static let scriptHandlerName = "_tw_"
    public let config: Config

    public var providerJsUrl: URL {
#if COCOAPODS
        let bundle = Bundle(for: TrustWeb3Provider.dummy.self)
        let bundleURL = bundle.resourceURL?.appendingPathComponent("TrustWeb3Provider.bundle")
        let resourceBundle = Bundle(url: bundleURL!)!
        return resourceBundle.url(forResource: filename, withExtension: "js")!
#else
        return Bundle.module.url(forResource: filename, withExtension: "js")!
#endif
    }

    public var providerScript: WKUserScript {
        let source = try! String(contentsOf: providerJsUrl)
        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    }

    public var injectScript: WKUserScript {
        let source = """
        (function() {

            const config = {
                ethereum: {
                    address: "\(config.ethereum.address)",
                    chainId: \(config.ethereum.chainId),
                    rpcUrl: "\(config.ethereum.rpcUrl)"
                },
                solana: {
                    cluster: "\(config.solana.cluster)",
                    // @todo: remove this when mobile supports versioned transactions
                    useLegacySign: true
                },
                aptos: {
                    network: "\(config.aptos.network)",
                    chainId: "\(config.aptos.chainId)"
                }
            };

            const strategy = 'CALLBACK';

            try {
                const core = trustwallet.core(strategy, (params) => {
                  webkit.messageHandlers._tw_.postMessage(params);
                });

                // Generate instances
                const ethereum = trustwallet.ethereum(config.ethereum);
                const solana = trustwallet.solana(config.solana);
                const cosmos = trustwallet.cosmos();
                const aptos = trustwallet.aptos(config.aptos);

                core.registerProviders([ethereum, solana, cosmos, aptos].map(provider => {
                  provider.sendResponse = core.sendResponse.bind(core);
                  provider.sendError = core.sendError.bind(core);
                  return provider;
                }));

                // Custom methods
                ethereum.emitChainChanged = (chainId) => {
                  ethereum.setChainId('0x' + parseInt(chainId || '1').toString(16));
                  ethereum.emit('chainChanged', ethereum.getChainId());
                  ethereum.emit('networkChanged', parseInt(chainId || '1'));
                };

                ethereum.setConfig = (config) => {
                  ethereum.setChainId('0x' + parseInt(config.ethereum.chainId || '1').toString(16));
                  ethereum.setAddress(config.ethereum.address);
                  ethereum.setRPCUrl(config.ethereum.rpcUrl);
                };
                // End custom methods

                cosmos.mode = 'extension';
                cosmos.providerNetwork = 'cosmos';
                cosmos.isKeplr = true;
                cosmos.version = "0.12.106";

                cosmos.enable = (chainIds)  => {
                  console.log(`==> enabled for ${chainIds}`);
                };

                // Attach to window
                trustwallet.ethereum = ethereum;
                trustwallet.solana = solana;
                trustwallet.cosmos = cosmos;
                trustwallet.TrustCosmos = trustwallet.cosmos;
                trustwallet.aptos = aptos;

                window.ethereum = trustwallet.ethereum;
                window.keplr = trustwallet.cosmos;
                window.aptos = trustwallet.aptos;

                const getDefaultCosmosProvider = (chainId) => {
                  return trustwallet.cosmos.getOfflineSigner(chainId);
                };

                window.getOfflineSigner = getDefaultCosmosProvider;
                window.getOfflineSignerOnlyAmino = getDefaultCosmosProvider;
                window.getOfflineSignerAuto = getDefaultCosmosProvider;
            } catch (e) {
              alert(e)
            }
        })();
        """
        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    }

    public init(config: Config) {
        self.config = config
    }
}
