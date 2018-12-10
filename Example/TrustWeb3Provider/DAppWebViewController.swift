//
//  ViewController.swift
//  TrustWeb3Provider
//
//  Created by hewigovens on 02/15/2018.
//  Copyright (c) 2018 hewigovens. All rights reserved.
//

import UIKit
import WebKit

class DAppWebViewController: UIViewController {

    @IBOutlet weak var urlField: UITextField!

    var homepage: String {
        return "https://js-eth-sign.surge.sh"
    }

    var infuraApiKey: String? {
        return ProcessInfo.processInfo.environment["INFURA_API_KEY"]
    }

    lazy var scriptConfig: WKUserScriptConfig = {
        return WKUserScriptConfig(
            address: "0x5Ee066cc1250E367423eD4Bad3b073241612811f",
            chainId: 1,
            rpcUrl: "https://mainnet.infura.io/v3/\(infuraApiKey!)",
            privacyMode: false
        )
    }()

    lazy var webview: WKWebView = {
        let config = WKWebViewConfiguration()
        let controller = WKUserContentController()
        controller.addUserScript(scriptConfig.providerScript)
        controller.addUserScript(scriptConfig.injectedScript)
        for name in DAppMethod.allCases {
            controller.add(self, name: name.rawValue)
        }
        config.userContentController = controller
        let webview = WKWebView(frame: .zero, configuration: config)
        webview.translatesAutoresizingMaskIntoConstraints = false
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
            return false
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
        let json = message.json
        print(json)
        guard let name = json["name"] as? String,
            let method = DAppMethod(rawValue: name),
            let id = json["id"] as? Int64 else {
            return
        }
        switch method {
        case .requestAccounts:
            let alert = UIAlertController(
                title: webview.title,
                message: "\(webview.url?.host! ?? "Website") would like to connect your account",
                preferredStyle: .alert
            )
            let address = scriptConfig.address
            alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
                webview?.evaluateJavaScript("window.ethereum.sendError(\(id), \"Canceled\")", completionHandler: nil)
            }))
            alert.addAction(UIAlertAction(title: "Connect", style: .default, handler: { [weak webview] _ in
                webview?.evaluateJavaScript("window.ethereum.setAddress(\"\(address)\");", completionHandler: nil)
                webview?.evaluateJavaScript("window.ethereum.sendResponse(\(id), [\"\(address)\"])", completionHandler: nil)
            }))
            present(alert, animated: true, completion: nil)
        default:
            break
        }
    }
}
