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
        return "https://restake.app/osmosis"
    }

    static let wallet = HDWallet(mnemonic: ".", passphrase: "")!
    static let privateKey = wallet.getKeyForCoin(coin: .osmosis)

    var provider = TrustWeb3Provider(
        ethereum: EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 1,
            rpcUrl: "https://cloudflare-eth.com"
        ),
        solana: SolanaConfig(
            address: "H4JcMPicKkHcxxDjkyyrLoQj7Kcibd9t815ak4UvTr9M",
            cluster: "mainnet-beta"
        ),
        cosmos: CosmosConfig(
            publicKey: privateKey.getPublicKeySecp256k1(compressed: true).description,
            address: "cosmos1t5u0jfg3ljsjrh2m9e47d4ny2hea7eehxrzdgd",
            chainId: "cosmoshub-4",
            rpcUrl: "https://cosmoshub.validator.network:443"
        )
    )

    var ethereumConfigs: [Int: EthereumConfig] = [
        42161: EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 42161,
            rpcUrl: "https://arb1.arbitrum.io/rpc"
        ),
        250: EthereumConfig(
            address: "0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f",
            chainId: 250,
            rpcUrl: "https://rpc.ftm.tools"
        )
    ]

    var cosmosConfigs: [String: CosmosConfig] = [
        "osmosis-1": CosmosConfig(
            publicKey: privateKey.getPublicKeySecp256k1(compressed: true).description,
            address: wallet.getAddressForCoin(coin: .osmosis),
            chainId: "osmosis-1",
            rpcUrl: "https://rpc.osmosis.zone/"
        ),
        "cosmoshub-4": CosmosConfig(
            publicKey: privateKey.getPublicKeySecp256k1(compressed: true).description,
            address: "cosmos1t5u0jfg3ljsjrh2m9e47d4ny2hea7eehxrzdgd",
            chainId: "cosmoshub-4",
            rpcUrl: "https://cosmoshub.validator.network:443"
        ),
        "kava_2222-10": CosmosConfig(
            publicKey: privateKey.getPublicKeySecp256k1(compressed: true).description,
            address: "kava1hsknpsfd7frd0y332cj852sw5a4zjmy0l3qzrt",
            chainId: "kava_2222-10",
            rpcUrl: "https://cosmoshub.validator.network:443"
        )
    ]

    lazy var webview: WKWebView = {
        let config = WKWebViewConfiguration()

        let controller = WKUserContentController()
        controller.addUserScript(provider.providerScript)
        controller.addUserScript(provider.injectScript)
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
            if network == .cosmos {
                if let chainId = extractCosmosChainId(json: json), let config = cosmosConfigs[chainId] {
                    provider.cosmos = config
                }
            }

            handleRequestAccounts(network: network, id: id)
        case .signTransaction:
            guard network == .cosmos else { print("not supported"); return }

            let input: CosmosSigningInput
            if let params = json["object"] as? [String: Any] {
                input = self.cosmosSigningInputAmino(params: params)!
            } else {
                fatalError("data is missing")
            }
            handleSignCosmosTransaction(input, network: network, id: id)
        case .signRawTransaction:
            switch network {
            case .solana:
                guard let raw = extractRaw(json: json) else {
                    print("raw json is missing")
                    return
                }

                handleSignSolanaRawTransaction(id: id, raw: raw)
            case .cosmos:
                let input: CosmosSigningInput
                if let params = json["object"] as? [String: Any] {
                    input = self.cosmosSigningInputDirect(params: params)!
                } else {
                    fatalError("data is missing")
                }

                handleSignCosmosTransaction(input, network: network, id: id)
            default:
                print("\(network.rawValue) doesn't support signRawTransaction")
                break
            }
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
            case .cosmos:
                fatalError()
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
        case .sendRawTransaction:
            guard network == .cosmos else { fatalError("\(network.rawValue) is not supported for this command") }
            guard
                let mode = extractMode(json: json),
                let raw = extractRaw(json: json)
            else {
                print("mode or raw json is missing")
                return
            }
            handleCosmosSendRawTransaction(id, mode, raw)
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
            if ethereumConfigs[chainId] != nil {
                handleSwitchEthereumChain(id: id, chainId: chainId)
            } else {
                handleAddChain(id: id, name: name, chainId: chainId, rpcUrls: rpcUrls)
            }
        case .switchChain:
            switch network {
            case .ethereum:
                guard
                    let chainId = extractEthereumChainId(json: json)
                else {
                    print("chain id is invalid")
                    return
                }
                handleSwitchEthereumChain(id: id, chainId: chainId)
            case .solana:
                fatalError()
            case .cosmos:
                guard
                    let chainId = extractCosmosChainId(json: json)
                else {
                    print("chain id is invalid")
                    return
                }
                handleSwitchCosmosChain(id: id, chainId: chainId)
            }
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
        alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
            webview?.tw.send(network: network, error: "Canceled", to: id)
        }))
        let provider = self.provider
        alert.addAction(UIAlertAction(title: "Connect", style: .default, handler: { [weak webview] _ in
            switch network {
            case .ethereum:
                let address = provider.ethereum.address
                webview?.tw.set(network: network.rawValue, address: address)
                webview?.tw.send(network: network, results: [address], to: id)
            case .solana:
                let address = provider.solana.address
                webview?.tw.send(network: network, results: [address], to: id)
            case .cosmos:
                let pubKey = provider.cosmos.publicKey
                let address = provider.cosmos.address
                let json = try! JSONSerialization.data(
                    withJSONObject: ["pubKey": pubKey, "address": address]
                )
                let jsonString = String(data: json, encoding: .utf8)!
                webview?.tw.send(network: network, result: jsonString, to: id)
            }

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

    func handleSignCosmosTransaction(_ input: CosmosSigningInput, network: ProviderNetwork, id: Int64) {
        let alert = UIAlertController(
            title: "Sign Transaction",
            message: "Smart contract call",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
            webview?.tw.send(network: network, error: "Canceled", to: id)
        }))
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { [weak webview] _ in
            // FIXME remove hardcoded coin: .osmosis
            let output: CosmosSigningOutput = AnySigner.sign(input: input, coin: .osmosis)
            let pubkey = PrivateKey(data: input.privateKey)!.getPublicKeySecp256k1(compressed: true)
            let signature: [String: Any] = [
                "pub_key": [
                    "type": "tendermint/PubKeySecp256k1", // Evmos might be different
                    "value": pubkey.data.base64EncodedString()
                ],
                "signature": output.signature.base64EncodedString()
            ]
            guard let signatureEncoded = try? JSONSerialization.data(withJSONObject: signature) else { return }
            guard let signatureResult = String(data: signatureEncoded, encoding: .utf8) else { return }
            webview?.tw.send(network: .cosmos, result: signatureResult, to: id)
        }))
        present(alert, animated: true, completion: nil)
    }

    func handleSignSolanaRawTransaction(id: Int64, raw: String) {
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
            self.ethereumConfigs[chainId] = EthereumConfig(address: self.provider.ethereum.address, chainId: chainId, rpcUrl: rpcUrls[0])
            print("\(name) added")
            self.webview.tw.sendNull(network: .ethereum, id: id)
        }))
        present(alert, animated: true, completion: nil)
    }

    func handleSwitchEthereumChain(id: Int64, chainId: Int) {
        guard let config = ethereumConfigs[chainId] else {
            alert(title: "Error", message: "Unknown chain id: \(chainId)")
            webview.tw.send(network: .ethereum, error: "Unknown chain id", to: id)
            return
        }

        if chainId == provider.ethereum.chainId {
            print("No need to switch, already on chain \(chainId)")
            webview.tw.sendNull(network: .ethereum, id: id)
        } else {

            let alert = UIAlertController(
                title: "Switch Chain",
                message: "ChainId: \(chainId)\nRPC: \(config.rpcUrl)",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
                webview?.tw.send(network: .ethereum, error: "Canceled", to: id)
            }))
            alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { [weak self] _ in
                guard let `self` = self else { return }
                self.provider.ethereum = config
                self.webview.tw.set(ethereumConfig: config)
                self.webview.tw.emitChange(chainId: chainId)
                self.webview.tw.sendNull(network: .ethereum, id: id)
            }))
            present(alert, animated: true, completion: nil)
        }
    }

    func handleSwitchCosmosChain(id: Int64, chainId: String) {
        guard let config = cosmosConfigs[chainId] else {
            alert(title: "Error", message: "Unknown chain id: \(chainId)")
            webview.tw.send(network: .ethereum, error: "Unknown chain id", to: id)
            return
        }

        if provider.cosmos.chainId == chainId {
            print("No need to switch, already on chain \(chainId)")
            webview.tw.sendNull(network: .cosmos, id: id)
        } else {
            let alert = UIAlertController(
                title: "Switch Chain",
                message: "ChainId: \(chainId)\nRPC: \(config.rpcUrl)",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "Cancel", style: .destructive, handler: { [weak webview] _ in
                webview?.tw.send(network: .ethereum, error: "Canceled", to: id)
            }))
            alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { [weak self] _ in
                guard let `self` = self else { return }
                self.provider.cosmos = config
                self.webview.tw.sendNull(network: .cosmos, id: id)
            }))
            present(alert, animated: true, completion: nil)
        }
    }

    func handleCosmosSendRawTransaction(_ id: Int64,_ mode: String,_ raw: String) {
        let url = URL(string: "https://lcd-osmosis.keplr.app/cosmos/tx/v1beta1/txs")!
        ["mode": mode, "tx_bytes": raw].postRequest(to: url) { result in
            switch result {
            case .failure(let error):
                self.webview.tw.send(network: .cosmos, error: error.localizedDescription, to: id)
            case .success(let json):
                guard let response = json["tx_response"] as? [String: Any],
                      let txHash = response["txhash"] as? String else {
                    self.webview.tw.send(network: .cosmos, error: "error json parsing", to: id)
                    return
                }
                self.webview.tw.send(network: .cosmos, result: txHash, to: id)
            }
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

    private func extractCosmosChainId(json: [String: Any]) -> String? {
        guard
            let params = json["object"] as? [String: Any],
            let chainId = params["chainId"] as? String
        else {
            return nil
        }
        return chainId
    }

    private func extractEthereumChainId(json: [String: Any]) -> Int? {
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

    private func extractMode(json: [String: Any]) -> String? {
        guard
            let params = json["object"] as? [String: Any],
            let mode = params["mode"] as? String
        else {
            return nil
        }

        switch mode {
          case "async":
            return "BROADCAST_MODE_ASYNC"
          case "block":
            return "BROADCAST_MODE_BLOCK"
          case "sync":
            return "BROADCAST_MODE_SYNC"
          default:
            return "BROADCAST_MODE_UNSPECIFIED"
        }
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

    private func cosmosSigningInputDirect(params: [String: Any]) -> CosmosSigningInput? {
        guard let accountNumberStr = params["account_number"] as? String, let accountNumber = UInt64(accountNumberStr) else { return nil }
        guard let chainID = params["chain_id"] as? String else { return nil }
        guard let authInfoBytesHex = params["auth_info_bytes"] as? String else { return nil }
        guard let authInfoBytes = Data(hexString: authInfoBytesHex) else { return nil }
        guard let bodyBytesHex = params["body_bytes"] as? String else { return nil }
        guard let bodyBytes = Data(hexString: bodyBytesHex) else { return nil }

        return CosmosSigningInput.with {
            $0.accountNumber = accountNumber
            $0.chainID = chainID
            $0.messages = [
                CosmosMessage.with {
                    $0.signDirectMessage = CosmosMessage.SignDirect.with {
                        $0.authInfoBytes = authInfoBytes
                        $0.bodyBytes = bodyBytes
                    }
                }
            ]
            $0.signingMode = .protobuf
            $0.privateKey = Self.privateKey.data
        }
    }

    private func cosmosSigningInputAmino(params: [String: Any]) -> CosmosSigningInput? {
        guard let accountNumberStr = params["account_number"] as? String, let accountNumber = UInt64(accountNumberStr) else { return nil }
        guard let chainID = params["chain_id"] as? String else { return nil }
        guard let fee = params["fee"] as? [String: Any] else { return nil }
        guard let gasStr = fee["gas"] as? String, let gas = UInt64(gasStr) else { return nil }
        guard let memo = params["memo"] as? String else { return nil }
        guard let sequenceStr = params["sequence"] as? String, let sequence = UInt64(sequenceStr) else { return nil }
        guard let msgs = params["msgs"] as? [[String: Any]] else { return nil }

        guard let feeAmounts = fee["amount"] as? [[String: Any]] else {
            return nil
        }

        return CosmosSigningInput.with {
            $0.signingMode = .json
            $0.accountNumber = accountNumber
            $0.chainID = chainID
            $0.memo = memo
            $0.sequence = sequence
            $0.messages = parseCosmosMessages(msgs)
            $0.fee = CosmosFee.with {
                $0.gas = gas
                $0.amounts = parseCosmosAmounts(feeAmounts)
            }
            $0.privateKey = Self.privateKey.data
        }
    }

    private func parseCosmosAmounts(_ amounts: [[String: Any]]) -> [CosmosAmount] {
        return amounts.compactMap { feeAmount -> CosmosAmount? in
            guard
                let amount = feeAmount["amount"] as? String,
                let denom = feeAmount["denom"] as? String
            else {
                return nil
            }
            return CosmosAmount.with {
                $0.amount = amount
                $0.denom = denom
            }
        }
    }

    private func parseCosmosMessages(_ messages: [[String: Any]]) -> [CosmosMessage] {
        messages.compactMap { params -> CosmosMessage? in
            guard let type = params["type"] as? String else { return nil }
            guard let value = params["value"] as? [String: Any] else { return nil }
            guard
                let data = try? JSONSerialization.data(withJSONObject: value, options: []),
                let jsonString = String(data: data, encoding: .utf8)
            else {
                return nil
            }

            return CosmosMessage.with {
                $0.rawJsonMessage = CosmosMessage.RawJSON.with {
                    $0.type = type
                    $0.value = jsonString
                }
            }
        }
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

extension Dictionary where Key == String {
    func postRequest(to rpc: URL, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        do {
            let data = try JSONSerialization.data(withJSONObject: self, options: [])

            var request = URLRequest(url: rpc)
            request.httpMethod = "POST"
            request.httpBody = data
            request.addValue("application/json", forHTTPHeaderField: "Content-Type")
            request.addValue("application/json", forHTTPHeaderField: "Accept")

            let task = URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("error is \(error.localizedDescription)")
                    completion(.failure(error))
                    return
                }

                guard
                    let data = data,
                    let result = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
                else {
                    return
                }
                DispatchQueue.main.async {
                    completion(.success(result))
                }
            }
            task.resume()
        } catch(let error) {
            print("error is \(error.localizedDescription)")
            completion(.failure(error))
        }
    }
}
