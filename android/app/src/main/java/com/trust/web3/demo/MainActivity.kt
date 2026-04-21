package com.trust.web3.demo

import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Bundle
import android.webkit.SslErrorHandler
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.ScriptHandler
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

class MainActivity : AppCompatActivity() {
    private var documentStartScript: ScriptHandler? = null

    companion object {
        private const val DAPP_URL = "https://www.magiceden.io/me"
        private const val CHAIN_ID = 56
        private const val RPC_URL = "https://bsc-dataseed2.binance.org"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_main)

        val providerJs = loadProviderJs()
        val bootstrapJs = loadBootstrapJs(
            CHAIN_ID,
            RPC_URL
        )
        WebView.setWebContentsDebuggingEnabled(true)
        val webview: WebView = findViewById(R.id.webview)
        webview.settings.run {
            javaScriptEnabled = true
            domStorageEnabled = true
        }

        val hasDocumentStartInjection = installDocumentStartInjection(
            webview,
            providerJs,
            bootstrapJs
        )

        WebAppInterface(this, webview, DAPP_URL).run {
            webview.addJavascriptInterface(this, "_tw_")

            val webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    if (!hasDocumentStartInjection) {
                        injectScripts(view, providerJs, bootstrapJs)
                    }
                }

                override fun onReceivedSslError(
                    view: WebView?,
                    handler: SslErrorHandler?,
                    error: SslError?
                ) {
                    // Ignore SSL certificate errors
                    handler?.proceed()
                    println(error.toString())
                }
            }
            webview.webViewClient = webViewClient
            webview.loadUrl(DAPP_URL)
        }
    }

    override fun onDestroy() {
        documentStartScript?.remove()
        documentStartScript = null
        super.onDestroy()
    }

    private fun installDocumentStartInjection(
        webView: WebView,
        providerJs: String,
        bootstrapJs: String
    ): Boolean {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            return false
        }

        documentStartScript?.remove()
        documentStartScript = WebViewCompat.addDocumentStartJavaScript(
            webView,
            providerJs + "\n" + bootstrapJs,
            setOf("*")
        )
        return true
    }

    private fun injectScripts(view: WebView?, providerJs: String, bootstrapJs: String) {
        view?.evaluateJavascript(providerJs) {
            view.evaluateJavascript(bootstrapJs, null)
        }
    }

    private fun loadProviderJs(): String {
        return resources.openRawResource(R.raw.trust_min).bufferedReader().use { it.readText() }
    }

    private fun loadBootstrapJs(chainId: Int, rpcUrl: String): String {
        val source = """
        (function() {
            const config = {
                ethereum: {
                    chainId: $chainId,
                    rpcUrl: "$rpcUrl"
                },
                solana: {
                    cluster: "mainnet-beta",
                    useLegacySign: true
                }
            };

            const strategy = 'CALLBACK';

            try {
                const core = trustwallet.core(strategy, (params) => {
                    if (params.name === 'wallet_requestPermissions') {
                        core.sendResponse(params.id, null);
                        return;
                    }

                    window._tw_.postMessage(JSON.stringify(params));
                });

                const ethereum = trustwallet.ethereum(config.ethereum);
                const solana = trustwallet.solana(config.solana);

                core.registerProviders([ethereum, solana].map((provider) => {
                    provider.sendResponse = core.sendResponse.bind(core);
                    provider.sendError = core.sendError.bind(core);
                    return provider;
                }));

                trustwallet.ethereum = ethereum;
                trustwallet.solana = solana;

                Object.assign(window.trustwallet, {
                    isTrust: true,
                    isTrustWallet: true,
                    request: ethereum.request.bind(ethereum),
                    send: ethereum.send.bind(ethereum),
                    on: (...params) => ethereum.on(...params),
                    off: (...params) => ethereum.off(...params),
                });

                window.ethereum = ethereum;
                window.solana = solana;
                window.trustWallet = window.trustwallet;
            } catch (error) {
                console.error('Trust Wallet Android provider bootstrap failed', error);
            }
        })();
        """
        return source
    }
}
