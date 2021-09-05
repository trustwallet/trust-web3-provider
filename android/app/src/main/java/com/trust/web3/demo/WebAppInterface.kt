package com.trust.web3.demo

import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import org.json.JSONObject
import splitties.alertdialog.appcompat.*
import splitties.alertdialog.material.materialAlertDialog
import wallet.core.jni.CoinType
import wallet.core.jni.Curve
import wallet.core.jni.PrivateKey

class WebAppInterface(
    private val context: Context,
    private val webView: WebView
) {
    private val privateKey = PrivateKey("0x4646464646464646464646464646464646464646464646464646464646464646".toHexByteArray())
    private val addr = CoinType.ETHEREUM.deriveAddress(privateKey).toLowerCase()

    @JavascriptInterface
    fun postMessage(json: String) {
        val obj = JSONObject(json)
        println(obj)
        val id = obj.getLong("id")
        val method = DAppMethod.fromValue(obj.getString("name"))
        when (method) {
            DAppMethod.REQUESTACCOUNTS -> {
                context.materialAlertDialog {
                    title = "Request Accounts"
                    message = addr
                    okButton {
                        val setAddress = "window.ethereum.setAddress(\"$addr\");"
                        val callback = "window.ethereum.sendResponse($id, [\"$addr\"])"
                        webView.post {
                            webView.evaluateJavascript(setAddress) {
                                // ignore
                            }
                            webView.evaluateJavascript(callback) { value ->
                                println(value)
                            }
                        }
                    }
                    cancelButton()
                }.show()
            }
            DAppMethod.SIGNMESSAGE -> {
                val data = extractMessage(obj)
                handleSignMessage(id = id, data = data, addPrefix = false)
            }

            // handle other methods here
            // signTransaction, signMessage, ecRecover, watchAsset, addEthereumChain
        }
    }

    private fun extractMessage(json: JSONObject): String {
        val param = json.getJSONObject("object")
        val data = param.getString("data")
        return data
    }

    private fun handleSignMessage(id: Long, data: String, addPrefix: Boolean) {
        context.materialAlertDialog {
            title = "Sign Message"
            message = if (addPrefix) "0x$data" else data
            cancelButton {
                webView.sendError("Cancel", id)
            }
            okButton {
                webView.sendResult(signEthereumMessage(data), id)
            }
        }.show()
    }

    private fun signEthereumMessage(message: String): String {
        val messagePrefix = "\u0019Ethereum Signed Message:\n"
        val byteArrayMsg = message.toByteArray()
        val prefix = (messagePrefix + byteArrayMsg.size).toByteArray()
        val result = ByteArray(prefix.size + byteArrayMsg.size)
        System.arraycopy(prefix, 0, result, 0, prefix.size)
        System.arraycopy(byteArrayMsg, 0, result, prefix.size, byteArrayMsg.size)

        val hash3Result = wallet.core.jni.Hash.keccak256(result)
        val signatureData = privateKey.sign(hash3Result, Curve.SECP256K1)
            .apply {
                (this[this.size - 1]) = (this[this.size - 1] + 27).toByte()
            }
        return Numeric.toHexString(signatureData)
    }
}
