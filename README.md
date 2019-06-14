# TrustWeb3Provider

[![Pod Version](https://img.shields.io/cocoapods/v/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Jitpack Version](https://jitpack.io/v/TrustWallet/trust-web3-provider.svg)](https://jitpack.io/#TrustWallet/trust-web3-provider/0.2.1)
[![License](https://img.shields.io/cocoapods/l/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Platform](https://img.shields.io/cocoapods/p/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Platform](https://img.shields.io/badge/platform-android-lightgrey.svg)](https://jitpack.io/#TrustWallet/trust-web3-provider/0.2.1)

TrustWeb3Provider currently bundles [web3 0.20.x](https://github.com/TrustWallet/trust-web3-provider/blob/master/src/package.json#L21).

## How to Identify Trust Provider

If trust provider injected properly `isTrust` will be `true`

```javascript
 web3.currentProvider.isTrust
```

## Projects [probably] using TrustWeb3Provider

- [Trust Wallet](https://trustwallet.com/)
- [TokenPocket](https://tokenpocket.jp/)
- [DappGo](https://www.cmcmbc.com/en-us/)
- [Vault](https://vault.io)
- [Kcash](https://www.kcash.com/)
- [WeiWallet](https://github.com/popshootjapan/WeiWallet-iOS/)
- Add your app here

## Installation

### iOS

TrustWeb3Provider is available through [CocoaPods](http://cocoapods.org). To install
it, simply add the following line to your Podfile:

```ruby
pod 'TrustWeb3Provider'
```

### Android

TrustWeb3Provider is available through [Jitpack](https://jitpack.io). To install it:

Step 1. Add jitpack in your root build.gradle at the end of repositories:

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
    implementation 'com.github.TrustWallet:trust-web3-provider:0.2.1'
}
```

## Authors

[vikmeup](https://github.com/vikmeup)
[hewigovens](https://github.com/hewigovens)
[madcake](https://github.com/madcake)
[Mish Ochu](https://github.com/mishfit)

## License

TrustWeb3Provider is available under the MIT license. See the LICENSE file for more info.
