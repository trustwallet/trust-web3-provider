# TrustWeb3Provider

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/trustwallet/trust-web3-provider)
[![License](https://img.shields.io/cocoapods/l/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Platform](https://img.shields.io/cocoapods/p/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Platform](https://img.shields.io/badge/platform-android-lightgrey.svg)](https://jitpack.io/#TrustWallet/trust-web3-provider/0.2.1)

TrustWeb3Provider currently bundles [web3 0.20.x](https://github.com/trustwallet/trust-web3-provider/blob/master/src/package.json#L22), we will follow MetaMask proposal: [No Longer Injecting web3.js](https://medium.com/metamask/no-longer-injecting-web3-js-4a899ad6e59e).

## How to Identify Trust Provider

If trust provider injected properly `isTrust` will be `true`

```javascript
window.ethereum.isTrust
```

## Installation

### iOS

TrustWeb3Provider is available through [CocoaPods](http://cocoapods.org). To install
it, simply add the following line to your Podfile:

```ruby
pod 'TrustWeb3Provider', git: 'https://github.com/trustwallet/trust-web3-provider', tag: '<latest_tag>'
```

Here is an example project located at `ios/TrustWeb3Provider.xcworkspace` to demonstrate how to use this provider.

### Android

TrustWeb3Provider is available through [Jitpack](https://jitpack.io) and [GitHub Packages](https://github.com/trustwallet/trust-web3-provider/packages), new version will only be available in GitHub.

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

## License

TrustWeb3Provider is available under the MIT license. See the LICENSE file for more info.
