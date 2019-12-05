//
//  ViewController.swift
//  TrustWeb3Provider
//
//  Created by hewigovens on 02/15/2018.
//  Copyright (c) 2018 hewigovens. All rights reserved.
//

import UIKit
import WebKit
import TrustWalletCore

class DAppWebViewController: UIViewController {

    @IBOutlet weak var urlField: UITextField!

    var homepage: String {
        return "https://js-eth-sign-2.surge.sh"
    }

    var infuraApiKey: String? {
        return ProcessInfo.processInfo.environment["INFURA_API_KEY"]
    }

    let privateKey = PrivateKey(data: Data(hexString: "0x4646464646464646464646464646464646464646464646464646464646464646")!)!

    lazy var address: String = {
        return CoinType.ethereum.deriveAddress(privateKey: privateKey).lowercased()
    }()

    lazy var scriptConfig: WKUserScriptConfig = {
        return WKUserScriptConfig(
            address: self.address,
            chainId: 1,
            jsonRpcUrl: "https://mainnet.infura.io/\(infuraApiKey!)"
        )
    }()

    lazy var webview: WKWebView = {
        let config = WKWebViewConfiguration()
        let controller = WKUserContentController()
        controller.addUserScript(scriptConfig.providerScript)
        controller.addUserScript(scriptConfig.injectedScript)
        controller.add(self, name: Web3Request.id)
        config.userContentController = controller
        let webview = WKWebView(frame: .zero, configuration: config)
        webview.translatesAutoresizingMaskIntoConstraints = false
        webview.uiDelegate = self
        return webview
    }()

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard checkApiKey() else { return }

        setupSubviews()
        urlField.text = homepage
        navigate(to: homepage)
    }

    func checkApiKey() -> Bool {
        guard infuraApiKey != nil else {
            let alert = UIAlertController(title: "No infura api key found", message: "Please set INFURA_API_KEY", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
            present(alert, animated: true, completion: nil)
            return true
        }
        return true
    }

    func setupSubviews() {
        urlField.keyboardType = .URL
        urlField.delegate = self

        view.addSubview(webview)
        NSLayoutConstraint.activate([
            webview.topAnchor.constraint(equalTo: urlField.bottomAnchor),
            webview.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webview.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webview.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webview.widthAnchor.constraint(equalTo: view.widthAnchor)
        ])
    }

    func navigate(to url: String) {
        guard let url = URL(string: url) else { return }
        webview.load(URLRequest(url: url))
    }
}

extension DAppWebViewController: UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        navigate(to: textField.text ?? "")
        textField.resignFirstResponder()
        return true
    }
}

extension DAppWebViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        print(message.json)
        do {
            let request = try JSONDecoder().decode(Web3Request.self, from: message.jsonData)
            print(request)
            let method = request.request.method
            let id = request.id
            switch method {
            case .requestEthereumAccounts:
                let alert = UIAlertController(
                    title: webview.title,
                    message: "\(webview.url?.host! ?? "Website") would like to connect your account",
                    preferredStyle: .alert
                )
                let address = scriptConfig.address
                alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
                    webview?.evaluateJavaScript("ethereum.sendError(\"\(id)\", \"rejected\")")
                }))
                alert.addAction(UIAlertAction(title: "Connect", style: .default, handler: { [weak webview] _ in
                    webview?.evaluateJavaScript("ethereum.sendResponse(\"\(id)\", [\"\(address)\"])")
                }))
                present(alert, animated: true, completion: nil)
            case .signEthereumMessage:
                guard case Web3Request.ParamsType.signature(let params) = request.request.params else {
                    return
                }
                var data = Data(hexString: params.message)!
                if params.addPrefix {
                    data = ethereumMessage(for: data)
                    data = Hash.keccak256(data: data)
                }
                var signed = privateKey.sign(digest: data, curve: .secp256k1)!
                signed[64] += 27
                webview.evaluateJavaScript("ethereum.sendResponse(\"\(id)\", \"\("0x" + signed.hexString)\")")
            case .ethereumAddressFromSignedMessage:
                guard case Web3Request.ParamsType.ecRecover(let params) = request.request.params else {
                    return
                }
                var data = Data(hexString: params.message)!
                let signature = Data(hexString: params.signature)!
                if params.addPrefix {
                    data = ethereumMessage(for: data)
                }
                let message = Hash.keccak256(data: data)
                let publicKey = privateKey.getPublicKeySecp256k1(compressed: false)
                if (publicKey.verify(signature: signature, message: message)) {
                    webview.evaluateJavaScript("ethereum.sendResponse(\"\(id)\", \"\(address)\")")
                } else {
                    webview.evaluateJavaScript("ethereum.sendError(\"\(id)\", \"failed\")")
                }
                break
            case .signEthereumTransaction:
                break
            case .submitEthereumTransaction:
                break
            }
        } catch let error {
            print(error)
        }
    }

    func ecRecover(signature: Data, message: Data) -> String? {
        let data = ethereumMessage(for: message)
        let hash = Hash.keccak256(data: data)
        guard let publicKey = PublicKey.recover(signature: signature, message: hash),
            PublicKey.isValid(data: publicKey.data, type: publicKey.keyType) else {
            return nil
        }
        return CoinType.ethereum.deriveAddressFromPublicKey(publicKey: publicKey)
    }

    private func ethereumMessage(for data: Data) -> Data {
        let prefix = "\u{19}Ethereum Signed Message:\n\(data.count)".data(using: .utf8)!
        return prefix + data
    }
}

extension DAppWebViewController: WKUIDelegate {
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard navigationAction.request.url != nil else {
           return nil
        }
        _ = webView.load(navigationAction.request)
        return nil
    }
}
