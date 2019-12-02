//
//  WKUserScriptConfig.swift
//  TrustWeb3Provider_Example
//
//  Created by hewigovens on 12/1/18.
//  Copyright © 2018 hewigovens. All rights reserved.
//

import Foundation
import WebKit

struct WKUserScriptConfig {

    let address: String
    let chainId: Int
    let jsonRpcUrl: String

    var providerJsUrl: URL {
        return Bundle.main.url(forResource: "trust-min", withExtension: "js", subdirectory: "dist")!
    }

    var providerScript: WKUserScript {
        let source = try! String(contentsOf: providerJsUrl)
        let script = WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        return script
    }

    var injectedScript: WKUserScript {
        let source = """
        (function() {
            var ethereum = TrustWeb3Provider(
                "\(jsonRpcUrl)",
                \(chainId)
            );
            window.ethereum = ethereum;
        
            window.chrome = {webstore: {}};
        })();
        """
        let script = WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        return script
    }
}
