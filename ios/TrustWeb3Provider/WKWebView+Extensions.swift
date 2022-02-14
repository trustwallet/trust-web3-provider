// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import Foundation
import WebKit

extension WKWebView {

    public func setAddress(_ address: String) {
        evaluateJavaScript("ethereum.setAddress(\"\(address)\");")
    }

    func setConfig(_ config: WKUserScriptConfig) {
        let script = """
        var config = {
            address: "\(config.address)",
            chainId: \(config.chainId),
            rpcUrl: "\(config.rpcUrl)"
        };
        ethereum.setConfig(config);
        """
        print(script)
        evaluateJavaScript(script)
    }

    func emitChange(chainId: Int) {
        let string = "0x" + String(chainId, radix: 16)
        let script = "ethereum.emitChainChanged(\"\(string)\");"
        print(script)
        evaluateJavaScript(script)
    }

    public func sendError(_ error: String, to id: Int64) {
        let script = String(format: "ethereum.sendError(%ld, \"%@\")", id, error)
        print(script)
        evaluateJavaScript(script)
    }

    public func sendResult(_ result: String, to id: Int64) {
        let script = String(format: "ethereum.sendResponse(%ld, \"%@\")", id, result)
        print(script)
        evaluateJavaScript(script)
    }

    public func sendNull(to id: Int64) {
        let script = String(format: "ethereum.sendResponse(%ld, null)", id)
        print(script)
        evaluateJavaScript(script)
    }

    public func sendResults(_ results: [String], to id: Int64) {
        let array = results.map { String(format: "\"%@\"", $0) }
        let script = String(format: "ethereum.sendResponse(%ld, [%@])", id, array.joined(separator: ","))
        print(script)
        evaluateJavaScript(script)
    }
}
