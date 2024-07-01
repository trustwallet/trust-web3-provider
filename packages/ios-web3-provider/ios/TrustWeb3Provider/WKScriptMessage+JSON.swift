// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import Foundation
import WebKit

extension WKScriptMessage {
    var json: [String: Any] {
        if let string = body as? String,
            let data = string.data(using: .utf8),
            let object = try? JSONSerialization.jsonObject(with: data, options: []),
            let dict = object as? [String: Any] {
            return dict
        } else if let object = body as? [String: Any] {
            return object
        }
        return [:]
    }
}

