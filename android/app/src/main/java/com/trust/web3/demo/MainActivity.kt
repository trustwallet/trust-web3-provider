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

    fun loadInitJs(chainId: Int, rpcUrl: String): String {
        val source = """
        (function() {
            var config = {
                chainId: $chainId,
                rpcUrl: "$rpcUrl",
                isDebug: true
            };
            window.ethereum = new trustwallet.Provider(config);
            window.web3 = new trustwallet.Web3(window.ethereum);
            trustwallet.postMessage = (json) => {
                window._tw_.postMessage(JSON.stringify(json));
            }
        })();
        """
        return  source
    }
}