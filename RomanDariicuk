# TrustWeb3Provider

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/trustwallet/trust-web3-provider)
[![License](https://img.shields.io/cocoapods/l/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Platform](https://img.shields.io/cocoapods/p/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Platform](https://img.shields.io/badge/platform-android-lightgrey.svg)](https://jitpack.io/#TrustWallet/trust-web3-provider/0.2.1)

TrustWeb3Provider is multi-network web3 provider used by TrustWallet. Currently it supports:

- Ethereum
- Solana

## How to Identify Trust Provider

If trust provider injected properly `isTrust` will be `true`

```javascript
window.ethereum.isTrust
// or
window.trustwallet.solana.isTrust
```

## Installation

### iOS

TrustWeb3Provider is available through CocoaPods and SPM (locally due to Xcode git lfs issue).

CocoaPods

Add this line to your `Podfile`:
```ruby
pod 'TrustWeb3Provider', :git => 'https://github.com/trustwallet/trust-web3-provider', :branch => 'master'
```

Swift Package Manager

Add this repo as a `git submodule`, then add it this to your `Package.swift`:

```swift
.package(name: "TrustWeb3Provider", path: "<local path>"),
```

Here is an example project located at `ios/TrustWeb3Provider.xcodeproj` to demonstrate how to use this provider.

### Android

TrustWeb3Provider is available through [Jitpack](https://jitpack.io)
#### Jitpack

To install it:

Step 1. Add jitpack to `repositories` in your root `build.gradle` file:

```groovy
allprojects {
    repositories {
        maven { url 'https://jitpack.io' }
    }
}
```

Step 2. Add the dependency

```groovy
dependencies {
    implementation 'com.github.trustwallet:trust-web3-provider:TAG'
}
```

## Authors

[vikmeup](https://github.com/vikmeup)  
[hewigovens](https://github.com/hewigovens)  
[madcake](https://github.com/madcake)  
[rsrbk](https://github.com/rsrbk)

## License

TrustWeb3Provider is available under the MIT license. See the LICENSE file for more info.
