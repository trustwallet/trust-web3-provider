# TrustWeb3Provider

[![Pod Version](https://img.shields.io/cocoapods/v/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Jitpack Version](https://jitpack.io/v/TrustWallet/trust-web3-provider.svg)](https://jitpack.io/#TrustWallet/trust-web3-provider/0.1.7)
[![License](https://img.shields.io/cocoapods/l/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Platform](https://img.shields.io/cocoapods/p/TrustWeb3Provider.svg?style=flat)](http://cocoapods.org/pods/TrustWeb3Provider)
[![Platform](https://img.shields.io/badge/platform-android-lightgrey.svg)](https://jitpack.io/#TrustWallet/trust-web3-provider/0.1.7)

## How to Identify Trust Provider

If trust provider injected properly `isTrust` will be `true`

```javascript
 web3.currentProvider.isTrust
```

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
    implementation 'com.github.TrustWallet:trust-web3-provider:0.1.7'
}
```

Step 3. Add web3 to your app

This can be done either in the layout:
```
 <trust.web3.Web3View
        android:id="@+id/web3view"
        android:layout_below="@+id/go"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        />
```

Or in code:
```
web3 = new Web3View(context);
```

Step 4. Configure network and wallet
```
web3.setChainId(1);
web3.setRpcUrl("https://mainnet.infura.io/llyrtzQ3YhkdESt2Fzrk");
web3.setWalletAddress(new Address("0xaa3cc54d7f10fa3a1737e4997ba27c34f330ce16"));
```

Step 5. Implement listeners
```
web3.setOnSignMessageListener(message -> {
    Toast.makeText(this, "Message: " + message.value, Toast.LENGTH_LONG).show();
    web3.onSignCancel(message);
});
web3.setOnSignPersonalMessageListener(message -> {
    Toast.makeText(this, "Personal message: " + message.value, Toast.LENGTH_LONG).show();
});
web3.setOnSignTransactionListener(transaction -> {
    Toast.makeText(this, "Transaction: " + transaction.value, Toast.LENGTH_LONG).show();
});
```

Feedback
```
web3.onSignCancel(Message|Transaction)(); // message/transaction canceled
web3.onSignMessageSuccessful(message, "0x...."); // message successfully signed
web3.onSignPersonalMessageSuccessful(message, "0x..."); // personal message successfully signed
web3.onSignTransactionSuccessful(transaction, "0x..."); // transaction successfully signed
web3.onSignError(Message|Transaction, "some_error"); // error during signing message/transaction
```

## Authors

vikmeup, vikmeup@gmail.com  
hewigovens, hewigovens@gmail.com  
madcake, wdiabloster@gmail.com  

## License

TrustWeb3Provider is available under the MIT license. See the LICENSE file for more info.
