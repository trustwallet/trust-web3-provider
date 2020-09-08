import UIKit
import XCTest
import TrustWeb3Provider

class Tests: XCTestCase {
    
    func testDecodeRequestAcounts() throws {
        let data = try loadJson("request_accounts")
        let request = try JSONDecoder().decode(Web3Request.self, from: data)

        XCTAssertNotNil(request)
        guard case Web3Request.ParamsType.requestAccounts = request.request.params else {
            throw Web3Request.Error.decodeError
        }
    }

    func testDecodeEthSign() throws {
        let data = try loadJson("eth_sign")
        let request = try JSONDecoder().decode(Web3Request.self, from: data)

        XCTAssertNotNil(request)
        guard case Web3Request.ParamsType.signature(let params) = request.request.params else {
            throw Web3Request.Error.decodeError
        }
        XCTAssertFalse(params.addPrefix)
    }

    func testDecodeECRecover() throws {
        let data = try loadJson("ec_recover")
        let request = try JSONDecoder().decode(Web3Request.self, from: data)

        XCTAssertNotNil(request)
        guard case Web3Request.ParamsType.ecRecover(let params) = request.request.params else {
            throw Web3Request.Error.decodeError
        }
        XCTAssertTrue(params.addPrefix)
    }

    func testDecodeTypedV3() throws {
        let data = try loadJson("typed_v3")
        let request = try JSONDecoder().decode(Web3Request.self, from: data)

        XCTAssertNotNil(request)
        guard case Web3Request.ParamsType.signature(let params) = request.request.params else {
            throw Web3Request.Error.decodeError
        }
        XCTAssertNotNil(params.typedDataJson)
    }

    func testDecodeSignTx() throws {
        let data = try loadJson("sign_tx")
        let request = try JSONDecoder().decode(Web3Request.self, from: data)

        XCTAssertNotNil(request)
        guard case Web3Request.ParamsType.signTx(let tx) = request.request.params else {
            throw Web3Request.Error.decodeError
        }
        XCTAssertEqual(tx.chainId, 1)
        XCTAssertEqual(tx.shouldSubmit, true)
    }

    func testDecodeSendTx() throws {
        let data = try loadJson("send_tx")
        let request = try JSONDecoder().decode(Web3Request.self, from: data)

        XCTAssertNotNil(request)
        guard case Web3Request.ParamsType.sendTx = request.request.params else {
            throw Web3Request.Error.decodeError
        }
    }

    func loadJson(_ name: String) throws -> Data {
        let bundle = Bundle(for: Tests.self)
        let url = bundle.url(forResource: name, withExtension: "json", subdirectory: "data")!
        return try Data(contentsOf: url)
    }
}
