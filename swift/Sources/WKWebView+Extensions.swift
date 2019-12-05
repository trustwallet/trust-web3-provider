// Copyright © 2017-2019 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import Foundation
import WebKit

extension WKWebView {
    public func sendError(_ error: String, to id: String) {
        let script = String(format: "ethereum.sendError(\"%@\", \"%@\")", id, error)
        evaluateJavaScript(script)
    }

    public func sendResult(_ result: String, to id: String) {
        let script = String(format: "ethereum.sendResponse(\"%@\", \"%@\")", id, result)
        evaluateJavaScript(script)
    }

    public func sendResults(_ results: [String], to id: String) {
        let array = results.map { String(format: "\"%@\"", $0) }
        let script = String(format: "ethereum.sendResponse(\"%@\", [%@])", id, array.joined(separator: ","))
        print(script)
        evaluateJavaScript(script)
    }
}
