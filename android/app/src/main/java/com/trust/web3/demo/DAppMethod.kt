package com.trust.web3.demo

enum class DAppMethod(value: String) {
    SIGNTRANSACTION("signTransaction"),
    SIGNPERSONALMESSAGE("signPersonalMessage"),
    SIGNMESSAGE("signMessage"),
    SIGNTYPEDMESSAGE("signTypedMessage"),
    ECRECOVER("ecRecover"),
    REQUESTACCOUNTS("requestAccounts"),
    WATCHASSET("watchAsset"),
    ADDETHEREUMCHAIN("addEthereumChain");

    companion object {
        fun fromValue(value: String): DAppMethod {
            return when (value) {
                "signTransaction" -> SIGNTRANSACTION
                "signPersonalMessage" -> SIGNPERSONALMESSAGE
                "signMessage" -> SIGNMESSAGE
                "signTypedMessage" -> SIGNTYPEDMESSAGE
                "ecRecover" -> ECRECOVER
                "requestAccounts" -> REQUESTACCOUNTS
                "watchAsset" -> WATCHASSET
                else -> ADDETHEREUMCHAIN
            }
        }
    }
}