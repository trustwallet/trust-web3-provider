package com.trust.web3.demo

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val provderJs = loadProviderJs()
        val initJs = loadInitJs(
            "0x7d8bf18C7cE84b3E175b339c4Ca93aEd1dD166F1",
            1,
            "https://mainnet.infura.io/v3/6e822818ec644335be6f0ed231f48310"
        )
        println("file lenght: ${provderJs.length}")
        WebView.setWebContentsDebuggingEnabled(true)
        val webview: WebView = findViewById(R.id.webview)
        webview.settings.javaScriptEnabled = true
        webview.addJavascriptInterface(WebAppInterface(webview), "_tw_")

        val webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                println("loaded: ${url}")
                view?.evaluateJavascript(provderJs, null)
                view?.evaluateJavascript(initJs, null)
            }
        }
        webview.webViewClient = webViewClient
        webview.loadUrl("https://js-eth-sign.surge.sh")
    }

    fun loadProviderJs(): String {
        return resources.openRawResource(R.raw.trust).bufferedReader().use { it.readText() }
    }

    fun loadInitJs(address: String, chainId: Int, rpcUrl: String): String {
        val source = """
        (function() {
            var config = {
                address: "$address".toLowerCase(),
                chainId: $chainId,
                rpcUrl: "$rpcUrl"
            };
            const provider = new window.Trust(config);
            provider.isDebug = true;
            window.ethereum = provider;
            window.tw = {
                postMessage: (jsonString) => {
                    window._tw_.postMessage(jsonString)
                }
            }
        })();
        """
        return  source
    }
}