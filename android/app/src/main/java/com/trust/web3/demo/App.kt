package com.trust.web3.demo

import android.app.Application

class App: Application() {
    init {
        System.loadLibrary("TrustWalletCore")
    }
}