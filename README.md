# Trust Web3 Provider

```
                    ___           ___           ___
      ___          /  /\         /  /\         /  /\          ___
     /__/\        /  /::\       /  /:/        /  /::\        /__/\
     \  \:\      /  /:/\:\     /  /:/        /__/:/\:\       \  \:\
      \__\:\    /  /::\ \:\   /  /:/        _\_ \:\ \:\       \__\:\
      /  /::\  /__/:/\:\_\:\ /__/:/     /\ /__/\ \:\ \:\      /  /::\
     /  /:/\:\ \__\/~|::\/:/ \  \:\    /:/ \  \:\ \:\_\/     /  /:/\:\
    /  /:/__\/    |  |:|::/   \  \:\  /:/   \  \:\_\:\      /  /:/__\/
   /__/:/         |  |:|\/     \  \:\/:/     \  \:\/:/     /__/:/
   \__\/          |__|:|~       \  \::/       \  \::/      \__\/
                   \__\|         \__\/         \__\/

```

Welcome to the Trust Wallet Web3 Provider repository. A set of providers and
javascript wrappers designed to facilitate web3 interactions between dApps and
Wallets.

This library allows you to handle dApps requests on your wallet and send the
response back by implementing providers for you, including EIP-1193.

```
 +----------------+            +------------------+           +---------------+
 |                |            |                  |           |               |
 |      dApps     |  <----->   |   web3 provider  |  <----->  |  your wallet  |
 |                |            |                  |           |               |
 +----------------+            +------------------+           +---------------+

```

## Supported chains

- Cosmos
- Solana
- Binance Chain
- Ethereum
