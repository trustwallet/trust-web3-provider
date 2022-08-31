// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "WalletCore",
    platforms: [.iOS(.v13)],
    products: [
        .library(name: "WalletCore", targets: ["WalletCore"]),
        .library(name: "SwiftProtobuf", targets: ["SwiftProtobuf"])
    ],
    dependencies: [],
    targets: [
        .binaryTarget(
            name: "WalletCore",
            url: "https://github.com/trustwallet/wallet-core/releases/download/3.0.1/WalletCore.xcframework.zip",
            checksum: "a25db35f8b88eb45c320a7c09dfcf8b8fdc27ebf69c81b82a378f4af39309653"
        ),
        .binaryTarget(
            name: "SwiftProtobuf",
            url: "https://github.com/trustwallet/wallet-core/releases/download/3.0.1/SwiftProtobuf.xcframework.zip",
            checksum: "1b7208b6ef46ed74c7a7825b6ca755e80042ab587fe207a3aa080b58eb670b54"
        )
    ]
)
