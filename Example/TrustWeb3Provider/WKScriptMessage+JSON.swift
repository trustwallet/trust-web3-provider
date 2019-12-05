//
//  WKScriptMessage+JSON.swift
//  TrustWeb3Provider_Example
//
//  Created by hewigovens on 12/1/18.
//  Copyright © 2018 hewigovens. All rights reserved.
//

import Foundation
import WebKit

extension WKScriptMessage {
    var jsonData: Data {
        if let string = body as? String, let data = string.data(using: .utf8) {
            return data
        } else if let dict = body as? [String: Any], let data = try? JSONSerialization.data(withJSONObject: dict, options: .prettyPrinted) {
            return data
        }
        return Data()
    }

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
