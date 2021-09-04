package com.trust.web3.demo

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_main)

        val provderJs = loadProviderJs()
        val initJs = loadInitJs(
            56,
            "https://bsc-dataseed2.binance.org"
        )
        println("file lenght: ${provderJs.length}")
        WebView.setWebContentsDebuggingEnabled(true)
        val webview: WebView = findViewById(R.id.webview)
        webview.settings.javaScriptEnabled = true
        webview.settings.domStorageEnabled = true
        webview.addJavascriptInterface(WebAppInterface(this, webview), "_tw_")

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
        return resources.openRawResource(R.raw.trust_min).bufferedReader().use { it.readText() }
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