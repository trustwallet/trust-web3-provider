// Copyright © 2017-2019 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import Foundation
import WebKit

extension WKScriptMessage {
    public var jsonData: Data {
        if let string = body as? String, let data = string.data(using: .utf8) {
            return data
        } else if let dict = body as? [String: Any], let data = try? JSONSerialization.data(withJSONObject: dict, options: .prettyPrinted) {
            return data
        }
        return Data()
    }

    public func decode() throws -> Web3Request {
        return try JSONDecoder().decode(Web3Request.self, from: jsonData)
    }
}
