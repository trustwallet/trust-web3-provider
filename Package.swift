// swift-tools-version:5.5

import PackageDescription

let package = Package(
    name: "PlasmaWeb3Provider",
    products: [
        .library(
            name: "PlasmaWeb3Provider",
            targets: ["PlasmaWeb3Provider"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "PlasmaWeb3Provider",
            dependencies: [],
            path: "dist",
            resources: [
                .process("plasma-min.js", localization: .none)
            ]
        )
    ]
)
