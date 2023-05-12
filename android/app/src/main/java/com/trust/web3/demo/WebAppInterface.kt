package com.trust.web3.demo

import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import splitties.alertdialog.appcompat.cancelButton
import splitties.alertdialog.appcompat.message
import splitties.alertdialog.appcompat.okButton
import splitties.alertdialog.appcompat.title
import splitties.alertdialog.material.materialAlertDialog
import wallet.core.jni.CoinType
import wallet.core.jni.Curve
import wallet.core.jni.PrivateKey

class WebAppInterface(
    private val context: Context,
    private val webView: WebView,
    private val dappUrl: String
) {
    private val privateKey =
        PrivateKey("0x4646464646464646464646464646464646464646464646464646464646464646".toHexByteArray())
    private val addr = CoinType.ETHEREUM.deriveAddress(privateKey).toLowerCase()
    private val pubKey = CoinType.SOLANA.deriveAddress(privateKey)

    @JavascriptInterface
    fun postMessage(json: String) {
        val obj = JSONObject(json)
        println(obj)
        val id = obj.getLong("id")
        val method = DAppMethod.fromValue(obj.getString("name"))
        val network = obj.getString("network")
        when (method) {
            DAppMethod.REQUESTACCOUNTS -> {
                context.materialAlertDialog {
                    title = "Request Accounts"
                    message = "${dappUrl} requests your address"
                    okButton {
                        val address = if (network == "solana") pubKey else addr
                        val setAddress = "window.$network.setAddress(\"$address\");"
                        val callback = "window.$network.sendResponse($id, [\"$address\"])"
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
                if (network == "ethereum")
                    handleSignMessage(id, data, addPrefix = false)
                else
                    handleSignSolanaMessage(id, data)
            }
            DAppMethod.SIGNPERSONALMESSAGE -> {
                val data = extractMessage(obj)
                handleSignMessage(id, data, addPrefix = true)
            }
            DAppMethod.SIGNTYPEDMESSAGE -> {
                val data = extractMessage(obj)
                val raw = extractRaw(obj)
                handleSignTypedMessage(id, data, raw)
            }
            else -> {
                context.materialAlertDialog {
                    title = "Error"
                    message = "$method not implemented"
                    okButton {
                    }
                }.show()
            }
        }
    }

    private fun extractMessage(json: JSONObject): ByteArray {
        val param = json.getJSONObject("object")
        val data = param.getString("data")
        return Numeric.hexStringToByteArray(data)
    }

    private fun extractRaw(json: JSONObject): String {
        val param = json.getJSONObject("object")
        return param.getString("raw")
    }

    private fun handleSignMessage(id: Long, data: ByteArray, addPrefix: Boolean) {
        context.materialAlertDialog {
            title = "Sign Ethereum Message"
            message = if (addPrefix) String(data, Charsets.UTF_8) else Numeric.toHexString(data)
            cancelButton {
                webView.sendError("ethereum","Cancel", id)
            }
            okButton {
                webView.sendResult("ethereum", signEthereumMessage(data, addPrefix), id)
            }
        }.show()
    }

    private fun handleSignSolanaMessage(id: Long, data: ByteArray) {
        context.materialAlertDialog {
            title = "Sign Solana Message"
            message = String(data, Charsets.UTF_8) ?: Numeric.toHexString(data)
            cancelButton {
                webView.sendError("solana", "Cancel", id)
            }
            okButton {
                webView.sendResult("solana", signSolanaMessage(data), id)
            }
        }.show()
    }

    private fun handleSignTypedMessage(id: Long, data: ByteArray, raw: String) {
        context.materialAlertDialog {
            title = "Sign Typed Message"
            message = raw
            cancelButton {
                webView.sendError("ethereum","Cancel", id)
            }
            okButton {
                webView.sendResult("ethereum", signEthereumMessage(data, false), id)
            }
        }.show()
    }

    private fun signEthereumMessage(message: ByteArray, addPrefix: Boolean): String {
        var data = message
        if (addPrefix) {
            val messagePrefix = "\u0019Ethereum Signed Message:\n"
            val prefix = (messagePrefix + message.size).toByteArray()
            val result = ByteArray(prefix.size + message.size)
            System.arraycopy(prefix, 0, result, 0, prefix.size)
            System.arraycopy(message, 0, result, prefix.size, message.size)
            data = wallet.core.jni.Hash.keccak256(result)
        }

        val signatureData = privateKey.sign(data, Curve.SECP256K1)
            .apply {
                (this[this.size - 1]) = (this[this.size - 1] + 27).toByte()
            }
        return Numeric.toHexString(signatureData)
    }

    private fun signSolanaMessage(message: ByteArray): String {
        val signature = privateKey.sign(message, Curve.ED25519)
        return Numeric.toHexString(signature)

    }
}
