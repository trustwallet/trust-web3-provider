const Web3 = require('web3')
const ProviderEngine = require('web3-provider-engine')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const Web3Subprovider = require("web3-provider-engine/subproviders/web3.js")
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js')

const context = window || global

context.chrome = { webstore: true }
context.Web3 = Web3

let callbacks = {}
let hookedSubProvider
let globalSyncOptions = {}

const Trust = {
  init (rpcUrl, options, syncOptions) { 
    const engine = new ProviderEngine()
    const web3 = new Web3(engine)
    context.web3 = web3
    globalSyncOptions = syncOptions

    engine.addProvider(hookedSubProvider = new HookedWalletSubprovider(options))
    engine.addProvider(new FilterSubprovider())
    engine.addProvider(new NonceSubprovider())
    engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(rpcUrl)))

    engine.on('error', err => console.error(err.stack))
    engine.isTrust = true
    engine.start()

    return engine
  },
  addCallback (id, cb, isRPC) {
    cb.isRPC = isRPC
    callbacks[id] = cb
  },
  executeCallback (id, error, value) {
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
}

if (typeof context.Trust === 'undefined') {
  context.Trust = Trust
}

ProviderEngine.prototype.send = function (payload) {
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

ProviderEngine.prototype.isConnected = function () {
    return this.send({
        id: 9999999999,
        jsonrpc: '2.0',
        method: 'net_listening',
        params: []
    }).result
}

module.exports = Trust

