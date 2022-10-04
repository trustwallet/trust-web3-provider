// Copyright © 2017-2022 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import XCTest
import TrustWeb3Provider
@testable import PodsTest

final class PodsTestTests: XCTestCase {
    func testLoadJs() throws {
        let ethereumConfig = TrustWeb3Provider.Config.EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 1,
            rpcUrl: "https://cloudflare-eth.com"
        )
        let provider = TrustWeb3Provider(config: TrustWeb3Provider.Config(ethereum: ethereumConfig))
        let url = provider.providerJsUrl
        let data = try Data(contentsOf: url)

        XCTAssertTrue(data.count > 0)
    }
}
