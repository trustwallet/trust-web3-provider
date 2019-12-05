// Copyright © 2017-2019 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import Foundation
import WebKit

public struct WKUserScriptConfig {

    public let address: String
    public let chainId: Int
    public let jsonRpcUrl: String

    public init(address: String, chainId: Int, jsonRpcUrl: String) {
        self.address = address
        self.chainId = chainId
        self.jsonRpcUrl = jsonRpcUrl
    }

    public var providerJsBundleUrl: URL {
        let bundlePath = Bundle.main.path(forResource: "TrustWeb3Provider", ofType: "bundle")
        let bundle = Bundle(path: bundlePath!)!
        return bundle.url(forResource: "trust-min", withExtension: "js")!
    }

    public var providerJsUrl: URL {
        return Bundle.main.url(forResource: "trust-min", withExtension: "js", subdirectory: "dist")!
    }

    public func providerScript(url: URL) -> WKUserScript {
        let source = try! String(contentsOf: url)
        let script = WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        return script
    }

    public var injectedScript: WKUserScript {
        let source = """
        (function() {
            window.ethereum = TrustWeb3Provider("\(jsonRpcUrl)", \(chainId));
            window.chrome = {webstore: {}};
        })();
        """
        let script = WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        return script
    }
}
