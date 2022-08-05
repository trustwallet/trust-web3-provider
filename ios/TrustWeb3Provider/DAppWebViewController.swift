// Copyright © 2017-2020 Trust Wallet.
//
// This file is part of Trust. The full Trust copyright notice, including
// terms governing use, modification, and redistribution, is contained in the
// file LICENSE at the root of the source code distribution tree.

import UIKit
import WebKit
import WalletCore
import TrustWeb3Provider

class DAppWebViewController: UIViewController {

    @IBOutlet weak var urlField: UITextField!

    var homepage: String {
        return "https://solanart.io"
    }

    static let solanaRPC = "https://api.mainnet-beta.solana.com"
    static let solanaPubkey = "H4JcMPicKkHcxxDjkyyrLoQj7Kcibd9t815ak4UvTr9M"
    static let privateKey = PrivateKey(data: Data(hexString: "0x4646464646464646464646464646464646464646464646464646464646464646")!)!

    var current: TrustWeb3Provider = TrustWeb3Provider(
        address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
        chainId: 1,
        rpcUrl: "https://cloudflare-eth.com"
    )

    var providers: [Int: TrustWeb3Provider] = [
        42161: TrustWeb3Provider(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 42161,
            rpcUrl: "https://arb1.arbitrum.io/rpc"
        ),
        250: TrustWeb3Provider(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 250,
            rpcUrl: "https://rpc.ftm.tools"
        )
    ]

    lazy var webview: WKWebView = {
        let config = WKWebViewConfiguration()

        let controller = WKUserContentController()
        controller.addUserScript(current.providerScript)
        controller.addUserScript(current.injectScript)
        controller.add(self, name: TrustWeb3Provider.scriptHandlerName)

        config.userContentController = controller
        config.allowsInlineMediaPlayback = true

        let webview = WKWebView(frame: .zero, configuration: config)
        webview.translatesAutoresizingMaskIntoConstraints = false
        webview.uiDelegate = self

        return webview
    }()

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        setupSubviews()
        urlField.text = homepage
        navigate(to: homepage)
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
        guard
            let method = extractMethod(json: json),
            let id = json["id"] as? Int64,
            let network = extractNetwork(json: json)
        else {
            return
        }
        switch method {
        case .requestAccounts:
            handleRequestAccounts(network: network, id: id)
        case .signRawTransaction:
            guard let raw = extractRaw(json: json) else {
                print("raw json is missing")
                return
            }

            handleSignRawTransaction(id: id, raw: raw)
        case .signMessage:
            guard let data = extractMessage(json: json) else {
                print("data is missing")
                return
            }
            switch network {
            case .ethereum:
                handleSignMessage(id: id, data: data, addPrefix: false)
            case .solana:
                handleSolanaSignMessage(id: id, data: data)
            }
        case .signPersonalMessage:
            guard let data = extractMessage(json: json) else {
                print("data is missing")
                return
            }
            handleSignMessage(id: id, data: data, addPrefix: true)
        case .signTypedMessage:
            guard
                let data = extractMessage(json: json),
                let raw = extractRaw(json: json)
            else {
                print("data or raw json is missing")
                return
            }
            handleSignTypedMessage(id: id, data: data, raw: raw)
        case .ecRecover:
            guard let tuple = extractSignature(json: json) else {
                print("signature or message is missing")
                return
            }
            let recovered = ecRecover(signature: tuple.signature, message: tuple.message) ?? ""
            print(recovered)
            DispatchQueue.main.async {
                self.webview.tw.send(network: .ethereum, result: recovered, to: id)
            }
        case .addEthereumChain:
            guard let (chainId, name, rpcUrls) = extractChainInfo(json: json) else {
                print("extract chain info error")
                return
            }
            if providers[chainId] != nil {
                handleSwitchChain(id: id, chainId: chainId)
            } else {
                handleAddChain(id: id, name: name, chainId: chainId, rpcUrls: rpcUrls)
            }
        case .switchEthereumChain:
            guard
                let chainId = extractChainId(json: json)
            else {
                print("chain id is invalid")
                return
            }
            handleSwitchChain(id: id, chainId: chainId)
        default:
            break
        }
    }

    func handleRequestAccounts(network: ProviderNetwork, id: Int64) {
        let alert = UIAlertController(
            title: webview.title,
            message: "\(webview.url?.host! ?? "Website") would like to connect your account",
            preferredStyle: .alert
        )
        let address = network == .solana ? Self.solanaPubkey: current.address
        alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
            webview?.tw.send(network: network, error: "Canceled", to: id)
        }))
        alert.addAction(UIAlertAction(title: "Connect", style: .default, handler: { [weak webview] _ in
            webview?.tw.set(network: network.rawValue, address: address)
            webview?.tw.send(network: network, results: [address], to: id)
        }))
        present(alert, animated: true, completion: nil)
    }

    func handleSignMessage(id: Int64, data: Data, addPrefix: Bool) {
        let alert = UIAlertController(
            title: "Sign Ethereum Message",
            message: addPrefix ? String(data: data, encoding: .utf8) ?? "" : data.hexString,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
            webview?.tw.send(network: .ethereum, error: "Canceled", to: id)
        }))
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { [weak webview] _ in
            let signed = self.signMessage(data: data, addPrefix: addPrefix)
            webview?.tw.send(network: .ethereum, result: "0x" + signed.hexString, to: id)
        }))
        present(alert, animated: true, completion: nil)
    }

    func handleSignTypedMessage(id: Int64, data: Data, raw: String) {
        let alert = UIAlertController(
            title: "Sign Typed Message",
            message: raw,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
            webview?.tw.send(network: .ethereum, error: "Canceled", to: id)
        }))
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { [weak webview] _ in
            let signed = self.signMessage(data: data, addPrefix: false)
            webview?.tw.send(network: .ethereum, result: "0x" + signed.hexString, to: id)
        }))
        present(alert, animated: true, completion: nil)
    }

    func handleSolanaSignMessage(id: Int64, data: Data) {
        let alert = UIAlertController(
            title: "Sign Solana Message",
            message: String(data: data, encoding: .utf8) ?? data.hexString,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
            webview?.tw.send(network: .solana, error: "Canceled", to: id)
        }))
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { [weak webview] _ in
            let signed = Self.privateKey.sign(digest: data, curve: .ed25519)!
            webview?.tw.send(network: .solana, result: "0x" + signed.hexString, to: id)
        }))
        present(alert, animated: true, completion: nil)
    }

    func handleSignRawTransaction(id: Int64, raw: String) {
        let alert = UIAlertController(
            title: "Sign Transaction",
            message: raw,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
            webview?.tw.send(network: .solana, error: "Canceled", to: id)
        }))
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { [weak webview] _ in
            guard let decoded = Base58.decodeNoCheck(string: raw) else { return }
            guard let signature = Self.privateKey.sign(digest: decoded, curve: .ed25519) else { return }
            let signatureEncoded = Base58.encodeNoCheck(data: signature)
            webview?.tw.send(network: .solana, result: signatureEncoded, to: id)
        }))
        present(alert, animated: true, completion: nil)
    }

    func handleAddChain(id: Int64, name: String, chainId: Int, rpcUrls: [String]) {
        let alert = UIAlertController(
            title: "Add: " + name,
            message: "ChainId: \(chainId)\nRPC: \(rpcUrls.joined(separator: "\n"))",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
            webview?.tw.send(network: .ethereum, error: "Canceled", to: id)
        }))
        alert.addAction(UIAlertAction(title: "Add", style: .default, handler: { [weak self] _ in
            guard let `self` = self else { return }
            self.providers[chainId] = TrustWeb3Provider(address: self.current.address, chainId: chainId, rpcUrl: rpcUrls[0])
            print("\(name) added")
            self.webview.tw.sendNull(network: .ethereum, id: id)
        }))
        present(alert, animated: true, completion: nil)
    }

    func handleSwitchChain(id: Int64, chainId: Int) {
        guard let provider = providers[chainId] else {
            alert(title: "Error", message: "Unknown chain id: \(chainId)")
            webview.tw.send(network: .ethereum, error: "Unknown chain id", to: id)
            return
        }

        if chainId == current.chainId {
            print("No need to switch, already on chain \(chainId)")
            webview.tw.sendNull(network: .ethereum, id: id)
        } else {

            let alert = UIAlertController(
                title: "Switch Chain",
                message: "ChainId: \(chainId)\nRPC: \(provider.rpcUrl)",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
                webview?.tw.send(network: .ethereum, error: "Canceled", to: id)
            }))
            alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { [weak self] _ in
                guard let `self` = self else { return }
                self.current = provider
                self.webview.tw.set(address: provider.address, chainId: provider.chainId, rpcUrl: provider.rpcUrl)
                self.webview.tw.emitChange(chainId: chainId)
                self.webview.tw.sendNull(network: .ethereum, id: id)
            }))
            present(alert, animated: true, completion: nil)
        }
    }

    func alert(title: String, message: String) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )
        alert.addAction(.init(title: "OK", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }

    private func extractMethod(json: [String: Any]) -> DAppMethod? {
        guard
            let name = json["name"] as? String
        else {
            return nil
        }
        return DAppMethod(rawValue: name)
    }

    private func extractNetwork(json: [String: Any]) -> ProviderNetwork? {
        guard
            let network = json["network"] as? String
        else {
            return nil
        }
        return ProviderNetwork(rawValue: network)
    }

    private func extractMessage(json: [String: Any]) -> Data? {
        guard
            let params = json["object"] as? [String: Any],
            let string = params["data"] as? String,
            let data = Data(hexString: string)
        else {
            return nil
        }
        return data
    }

    private func extractSignature(json: [String: Any]) -> (signature: Data, message: Data)? {
        guard
            let params = json["object"] as? [String: Any],
            let signature = params["signature"] as? String,
            let message = params["message"] as? String
        else {
            return nil
        }
        return (Data(hexString: signature)!, Data(hexString: message)!)
    }

    private func extractChainInfo(json: [String: Any]) ->(chainId: Int, name: String, rpcUrls: [String])? {
        guard
            let params = json["object"] as? [String: Any],
            let string = params["chainId"] as? String,
            let chainId = Int(String(string.dropFirst(2)), radix: 16),
            let name = params["chainName"] as? String,
            let urls = params["rpcUrls"] as? [String]
        else {
            return nil
        }
        return (chainId: chainId, name: name, rpcUrls: urls)
    }

    private func extractChainId(json: [String: Any]) -> Int? {
        guard
            let params = json["object"] as? [String: Any],
            let string = params["chainId"] as? String,
            let chainId = Int(String(string.dropFirst(2)), radix: 16),
            chainId > 0
        else {
            return nil
        }
        return chainId
    }

    private func extractRaw(json: [String: Any]) -> String? {
        guard
            let params = json["object"] as? [String: Any],
            let raw = params["raw"] as? String
        else {
            return nil
        }
        return raw
    }

    private func signMessage(data: Data, addPrefix: Bool = true) -> Data {
        let message = addPrefix ? Hash.keccak256(data: ethereumMessage(for: data)) : data
        var signed = Self.privateKey.sign(digest: message, curve: .secp256k1)!
        signed[64] += 27
        return signed
    }

    private func ecRecover(signature: Data, message: Data) -> String? {
        let data = ethereumMessage(for: message)
        let hash = Hash.keccak256(data: data)
        guard let publicKey = PublicKey.recover(signature: signature, message: hash),
              PublicKey.isValid(data: publicKey.data, type: publicKey.keyType) else {
            return nil
        }
        return CoinType.ethereum.deriveAddressFromPublicKey(publicKey: publicKey).lowercased()
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

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "", message: message, preferredStyle: .alert)
        alert.addAction(.init(title: "OK", style: .default, handler: { _ in
            completionHandler()
        }))
        present(alert, animated: true, completion: nil)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "", message: message, preferredStyle: .alert)
        alert.addAction(.init(title: "OK", style: .default, handler: { _ in
            completionHandler(true)
        }))
        alert.addAction(.init(title: "Cancel", style: .cancel, handler: { _ in
            completionHandler(false)
        }))
        present(alert, animated: true, completion: nil)
    }
}
