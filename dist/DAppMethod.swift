import Foundation

public enum DAppMethod: String, Decodable, CaseIterable {
    case signRawTransaction
    case signTransaction
    case signMessage
    case signTypedMessage
    case signPersonalMessage
    case sendTransaction
    case ecRecover
    case requestAccounts
    case watchAsset
    case addEthereumChain
    case switchEthereumChain // legacy compatible
    case switchChain
}
