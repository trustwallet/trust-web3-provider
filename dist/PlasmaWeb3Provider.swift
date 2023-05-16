import Foundation
import WebKit

public struct PlasmaWeb3Provider {
    public struct Config: Equatable {
        public let ethereum: EthereumConfig
        public let solana: SolanaConfig
        public let aptos: AptosConfig

        public init(
            ethereum: EthereumConfig,
            solana: SolanaConfig = SolanaConfig(cluster: "mainnet-beta"),
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
    private let filename = "plasma-min"    
    public static let scriptHandlerName = "_pw_"
    public let config: Config

    public var providerJsUrl: URL {
#if COCOAPODS
        let bundle = Bundle(for: PlasmaWeb3Provider.dummy.self)
        let bundleURL = bundle.resourceURL?.appendingPathComponent("PlasmaWeb3Provider.bundle")
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

    public var injectLogScript: WKUserScript {
        let source =
        """
        (function() {
            function captureLog(emoji, type, args) {
                window.webkit.messageHandlers.logHandler.postMessage(
                    `${emoji} JS ${type}: ${Object.values(args)
                      .map(v => typeof(v) === "undefined" ? "undefined" : typeof(v) === "object" ? JSON.stringify(v) : v.toString())
                      .map(v => v.substring(0, 3000)) // Limit msg to 3000 chars
                      .join(", ")}`
                  );
            }

            let originalLog = console.log;
            let originalWarn = console.warn;
            let originalError = console.error;
            let originalDebug = console.debug;

            window.console.log = function() { captureLog("📗", "log", arguments); originalLog.apply(null, arguments) }
            window.console.warn = function() { captureLog("📙", "warning", arguments); originalWarn.apply(null, arguments) }
            window.console.error = function() { captureLog("📕", "error", arguments); originalError.apply(null, arguments) }
            window.console.debug = function() { captureLog("📘", "debug", arguments); originalDebug.apply(null, arguments) }

            window.addEventListener("error", function(e) {
                captureLog("💥", "Uncaught", [`${e.message} at ${e.filename}:${e.lineno}:${e.colno}`])
            });
        }();
        """
        
        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    }
    
    
    public var injectScript: WKUserScript {
        let source = """
        (function() {
            var config = {
                ethereum: {
                    address: "\(config.ethereum.address)",
                    chainId: \(config.ethereum.chainId),
                    rpcUrl: "\(config.ethereum.rpcUrl)"
                },
                solana: {
                    cluster: "\(config.solana.cluster)"
                },
                aptos: {
                    network: "\(config.aptos.network)",
                    chainId: "\(config.aptos.chainId)"
                }
            };

            plasmawallet.ethereum = new plasmawallet.Provider(config);
            plasmawallet.solana = new plasmawallet.SolanaProvider(config);
            plasmawallet.cosmos = new plasmawallet.CosmosProvider(config);
            plasmawallet.aptos = new plasmawallet.AptosProvider(config);

            plasmawallet.postMessage = (jsonString) => {
                webkit.messageHandlers._pw_.postMessage(jsonString)
            };

            window.ethereum = plasmawallet.ethereum;
            window.keplr = plasmawallet.cosmos;
            window.aptos = plasmawallet.aptos;

            const getDefaultCosmosProvider = (chainId) => {
                return plasmawallet.cosmos.getOfflineSigner(chainId);
            }

            window.getOfflineSigner = getDefaultCosmosProvider;
            window.getOfflineSignerOnlyAmino = getDefaultCosmosProvider;
            window.getOfflineSignerAuto = getDefaultCosmosProvider;
        
            window.bottomOffset = 50;
        })();
        """
        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    }

    public init(config: Config) {
        self.config = config
    }
}
