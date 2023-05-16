import WebKit

public struct TypeWrapper<T> {
    let value: T

    init(value: T) {
        self.value = value
    }
}

public extension WKWebView {
    var pw: TypeWrapper<WKWebView> {
        return TypeWrapper(value: self)
    }
}

public extension TypeWrapper where T == WKWebView {
    func set(network: String, address: String) {
        let script = String(format: "plasmatwallet.\(network).setAddress(\"%@\");", address.lowercased())
        value.evaluateJavaScript(script)
    }

    func set(config: PlasmaWeb3Provider.Config) {
        let script = """
        var config = {
            ethereum: {
                address: "\(config.ethereum.address)",
                chainId: \(config.ethereum.chainId),
                rpcUrl: "\(config.ethereum.rpcUrl)"
            }
        };
        ethereum.setConfig(config);
        """
        value.evaluateJavaScript(script)
    }

    func emitChange(chainId: Int) {
        let string = "0x" + String(chainId, radix: 16)
        let script = String(format: "plasmawallet.ethereum.emitChainChanged(\"%@\");", string)
        value.evaluateJavaScript(script)
    }

    func send(network: ProviderNetwork, error: String, to id: Int64) {
        let script = String(format: "plasmawallet.\(network.rawValue).sendError(%ld, \"%@\")", id, error)
        value.evaluateJavaScript(script)
    }

    func send(network: ProviderNetwork, result: String, to id: Int64) {
        let script = String(format: "plasmawallet.\(network.rawValue).sendResponse(%ld, \'%@\')", id, result)
        value.evaluateJavaScript(script)
    }

    func sendNull(network: ProviderNetwork, id: Int64) {
        let script = String(format: "plasmawallet.\(network.rawValue).sendResponse(%ld, null)", id)
        value.evaluateJavaScript(script)
    }

    func send(network: ProviderNetwork, results: [String], to id: Int64) {
        let array = results.map { String(format: "\"%@\"", $0) }
        let script = String(format: "plasmawallet.\(network.rawValue).sendResponse(%ld, [%@])", id, array.joined(separator: ","))
        value.evaluateJavaScript(script)
    }

    func removeScriptHandler() {
        value.configuration.userContentController.removeScriptMessageHandler(forName: PlasmaWeb3Provider.scriptHandlerName)
    }
}
