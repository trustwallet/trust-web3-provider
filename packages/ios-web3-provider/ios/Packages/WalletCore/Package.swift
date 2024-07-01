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
            url: "https://github.com/trustwallet/wallet-core/releases/download/3.0.5/WalletCore.xcframework.zip",
            checksum: "10b50d569849349f82072325ca2d7cc549c2de4ece1c1ce2b2021d607ebcac17"
        ),
        .binaryTarget(
            name: "SwiftProtobuf",
            url: "https://github.com/trustwallet/wallet-core/releases/download/3.0.5/SwiftProtobuf.xcframework.zip",
            checksum: "c84ebee2d15c0d310a60981eb69e0dfc41871fcc22ac8fbfa1677361506e73cf"
        )
    ]
)
