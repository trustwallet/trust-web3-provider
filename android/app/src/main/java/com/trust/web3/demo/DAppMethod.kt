package com.trust.web3.demo

enum class DAppMethod {
    SIGNTRANSACTION,
    SIGNPERSONALMESSAGE,
    SIGNMESSAGE,
    SIGNTYPEDMESSAGE,
    ECRECOVER,
    REQUESTACCOUNTS,
    WATCHASSET,
    ADDETHEREUMCHAIN;

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