const Web3 = require('web3')
const ProviderEngine = require('web3-provider-engine')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const Web3Subprovider = require("web3-provider-engine/subproviders/provider.js")
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js')
const SubscriptionsSubprovider = require('web3-provider-engine/subproviders/subscriptions.js')

const context = window || global

context.chrome = { webstore: true }
context.Web3 = Web3

let callbacks = {}
let hookedSubProvider
let globalSyncOptions = {}

class TrustWeb3Provider extends ProviderEngine {
  constructor(options, syncOptions) {
    super();
    const engine = this
    const web3 = new Web3(this)
    const { rpcUrl } = options

    context.web3 = web3
    globalSyncOptions = syncOptions

    engine.addProvider(new CacheSubprovider())
    engine.addProvider(new SubscriptionsSubprovider())
    engine.addProvider(new FilterSubprovider())
    engine.addProvider(hookedSubProvider = new HookedWalletSubprovider(options))
    engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(rpcUrl)))
    engine.on('error', err => console.error(err.stack))
    engine.isTrust = true
    engine.start()
  }

  addCallback(id, cb, isRPC) {
    cb.isRPC = isRPC
    callbacks[id] = cb
  }

  executeCallback(id, error, value) {
    console.log(`executing callback: \nid: ${id}\nvalue: ${value}\nerror: ${error}\n`)
    let callback = callbacks[id]
    if (callback.isRPC) {
        const response = {'id': id, jsonrpc: '2.0', result: value, error: {message: error} }
      if (error) {
        callback(response, null)
      } else {
        callback(null, response)
      }
    } else {
      callback(error, value)
    }
    delete callbacks[id]
  }

  send(payload) {
    const self = this
    let result = null
    switch (payload.method) {
      case 'eth_accounts':
        let address = globalSyncOptions.address
        result = address ? [address] : []
        break
      case 'eth_coinbase':
        result = globalSyncOptions.address || null
        break
      case 'eth_uninstallFilter':
        self.sendAsync(payload, noop)
        result = true
        break
      case 'net_version':
        result = globalSyncOptions.networkVersion || null
        break
      case 'net_listening':
        try {
          self._providers.filter(p => p.provider !== undefined)[0].provider.send(payload)
          result = true
        } catch (e) {
          result = false
        }
        break
        // throw not-supported Error
      default:
        var message = `The Trust Web3 object does not support synchronous methods like ${payload.method} without a callback parameter.`
        throw new Error(message)
    }
    // return the result
    return {
      id: payload.id,
      jsonrpc: payload.jsonrpc,
      result: result,
    }
  }

  isConnected() {
    return this.send({
        id: 9999999999,
        jsonrpc: '2.0',
        method: 'net_listening',
        params: []
    }).result
  }
}

if (typeof context.Trust === 'undefined') {
  context.Trust = TrustWeb3Provider
}

module.exports = TrustWeb3Provider
