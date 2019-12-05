// Copyright © 2017-2019 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import Foundation

public struct Web3Request: Decodable {

    public static let id = "WEB3_REQUEST"

    public enum Error: LocalizedError {
        case decodeError
    }

    public let id: String
    public let type: String
    public let request: Request

    public struct Request: Decodable {
        public let method: Method
        public let params: ParamsType
    }

    public enum Method: String, Decodable {
        case requestEthereumAccounts
        case signEthereumMessage
        case signEthereumTransaction
        case submitEthereumTransaction
        case ethereumAddressFromSignedMessage
    }

    public enum ParamsType: Decodable {
        case requestAccounts
        case signature(SignatureRequest)
        case ecRecover(RecoverRequest)
        case signTx(TransactionSign)
        case sendTx(TransactionSend)

        private enum CodingKeys: String, CodingKey {
            case appName

            case address
            case message
            case signature
            case addPrefix
            case typedDataJson

            case chainId
            case data
            case fromAddress
            case gasLimit
            case gasPriceInWei
            case nonce
            case shouldSubmit
            case toAddress
            case weiValue

            case signedTransaction
        }
    }

    public struct SignatureRequest: Codable {
        public let address: String
        public let message: String
        public let addPrefix: Bool
        public let typedDataJson: String?
    }

    public struct RecoverRequest {
        public let message: String
        public let signature: String
        public let addPrefix: Bool
    }

    public struct TransactionSign {
        public let chainId: Int
        public let data: String
        public let fromAddress: String
        public let gasLimit: String?
        public let gasPriceInWei: String?
        public let nonce: String?
        public let shouldSubmit: Bool
        public let toAddress: String?
        public let weiValue: String?
    }

    public struct TransactionSend {
        public let chainId: Int
        public let signedTransaction: String
    }
}

extension Web3Request.ParamsType {
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if (try? container.decode(String.self, forKey: .appName)) != nil {
            self = .requestAccounts
        } else if let address = try? container.decode(String.self, forKey: .address) {
            self = .signature(Web3Request.SignatureRequest(
                address: address,
                message: try container.decode(String.self, forKey: .message),
                addPrefix: try container.decode(Bool.self, forKey: .addPrefix),
                typedDataJson: try container.decodeIfPresent(String.self, forKey: .typedDataJson
                )
            ))
        } else if let signature = try? container.decode(String.self, forKey: .signature) {
            self = .ecRecover(Web3Request.RecoverRequest(
                message: try container.decode(String.self, forKey: .message),
                signature: signature,
                addPrefix: try container.decode(Bool.self, forKey: .addPrefix))
            )
        } else if let fromAddress = try? container.decode(String.self, forKey: .fromAddress) {
            self = .signTx(Web3Request.TransactionSign(
                chainId: try container.decode(Int.self, forKey: .chainId),
                data: try container.decode(String.self, forKey: .data),
                fromAddress: fromAddress,
                gasLimit: try container.decodeIfPresent(String.self, forKey: .gasLimit),
                gasPriceInWei: try container.decode(String.self, forKey: .gasPriceInWei),
                nonce: try container.decodeIfPresent(String.self, forKey: .nonce),
                shouldSubmit: try container.decode(Bool.self, forKey: .shouldSubmit),
                toAddress: try container.decode(String.self, forKey: .toAddress),
                weiValue: try container.decode(String.self, forKey: .weiValue)
                )
            )
        } else if let signedTransaction = try? container.decode(String.self, forKey: .signedTransaction) {
            self = .sendTx(Web3Request.TransactionSend(
                chainId: try container.decode(Int.self, forKey: .chainId),
                signedTransaction: signedTransaction
                )
            )
        } else {
            throw Web3Request.Error.decodeError
        }
    }
}
