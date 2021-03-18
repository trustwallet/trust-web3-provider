package com.trust.web3.demo

import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import org.json.JSONObject

class WebAppInterface(private val context: WebView) {
    @JavascriptInterface
    fun postMessage(json: String) {
        val obj = JSONObject(json)
        println(obj)
        val id = obj["id"]
        val addr = "0x7d8bf18C7cE84b3E175b339c4Ca93aEd1dD166F1"

        when(obj["name"]) {
            "requestAccounts" -> {
                val callback = "window.ethereum.sendResponse($id, [\"$addr\"])"
                context.post {
                    context.evaluateJavascript(callback) { value ->
                        println(value)
                    }
                }
            }
            // handle other methods here
            // signTransaction, signMessage, ecRecover, watchAsset, addEthereumChain
        }
    }
}
