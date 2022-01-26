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
            url: "https://github.com/trustwallet/wallet-core/releases/download/2.7.0/WalletCore.xcframework.zip",
            checksum: "42812dfdcb1e003d41755f3df87a04ecd8ad2ef6fe475756b67f13a717724f5b"
        ),
        .binaryTarget(
            name: "SwiftProtobuf",
            url: "https://github.com/trustwallet/wallet-core/releases/download/2.7.0/SwiftProtobuf.xcframework.zip",
            checksum: "3d70a5432e5c3e1f8b6f52eee87727f9c45f51f3b51d8defb7495f567da945a2"
        )
    ]
)
