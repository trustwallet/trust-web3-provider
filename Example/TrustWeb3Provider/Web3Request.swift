//
//  DAppMethod.swift
//  TrustWeb3Provider_Example
//
//  Created by Tao Xu on 12/1/18.
//  Copyright © 2018 CocoaPods. All rights reserved.
//

import Foundation

struct Web3Request: Decodable {

    static let id = "WEB3_REQUEST"

    enum Error: LocalizedError {
        case decodeError
    }

    enum Method: String, Decodable {
        case requestEthereumAccounts
        case signEthereumMessage
        case signEthereumTransaction
        case submitEthereumTransaction
        case ethereumAddressFromSignedMessage
    }

    enum ParamsType: Decodable {
        case requestAccounts
        case signature(SignatureParams)
        case ecRecover(RecoverParams)

        private enum CodingKeys: String, CodingKey {
            case appName
            case address
            case message
            case signature
            case addPrefix
            case typedDataJson
        }

        init(from decoder: Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            if (try? container.decode(String.self, forKey: .appName)) != nil {
                self = .requestAccounts
            } else if let address = try? container.decode(String.self, forKey: .address) {
                self = .signature(SignatureParams(
                    address: address,
                    message: try container.decode(String.self, forKey: .message),
                    addPrefix: try container.decode(Bool.self, forKey: .addPrefix),
                    typedDataJson: try container.decodeIfPresent(String.self, forKey: .typedDataJson
                    )
                ))
            } else if let signature = try? container.decode(String.self, forKey: .signature) {
                self = .ecRecover(RecoverParams(
                    message: try container.decode(String.self, forKey: .message),
                    signature: signature,
                    addPrefix: try container.decode(Bool.self, forKey: .addPrefix))
                )
            } else {
                throw Error.decodeError
            }
        }
    }

    struct SignatureParams: Codable {
        let address: String
        let message: String
        let addPrefix: Bool
        let typedDataJson: String?
    }

    struct RecoverParams {
        let message: String
        let signature: String
        let addPrefix: Bool
    }

    struct Request: Decodable {
        let method: Method
        let params: ParamsType
    }

    let id: String
    let type: String
    let request: Request
}
