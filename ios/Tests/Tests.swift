// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import UIKit
import XCTest

class Tests: XCTestCase {

    func testBundleJs() {
        let bundlePath = Bundle.main.path(forResource: "TrustWeb3Provider", ofType: "bundle")

        XCTAssertNotNil(bundlePath)

        let bundle = Bundle(path: bundlePath!)

        XCTAssertNotNil(bundle)
        XCTAssertNotNil(bundle?.url(forResource: "trust-min", withExtension: "js"))
    }
}
