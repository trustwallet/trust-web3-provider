const context = window || global,
      debug = require('debug')('TrustWeb3Provider'),
      FilterSubprovider = require('web3-provider-engine/subproviders/filters.js'),
      HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js'),
      map = require('async/map'),
      ProviderEngine = require('web3-provider-engine'),
      Provider = require('./provider'),
      Web3 = require('web3')

context.chrome = { webstore: true }
context.Web3 = Web3

let callbacks = {},
    websocketProvider,
    globalSyncOptions = {}

class TrustWeb3Provider extends ProviderEngine {
  constructor (options) {
    super()
    const engine = this,
          web3 = new Web3(this),
          { rpcUrl } = options

    context.web3 = web3
    globalSyncOptions = options

    engine.addProvider(new HookedWalletSubprovider(options))

    if (options.wssUrl) {
      engine.addProvider(new Provider(websocketProvider = new Web3.providers.WebsocketProvider(options.wssUrl)))
    } else {
      engine.addProvider(new FilterSubprovider())
      engine.addProvider(new Provider(new Web3.providers.HttpProvider(rpcUrl)))
    }

    if (websocketProvider) {
      websocketProvider.on('data', () => {
        engine.emit('data', arguments)
      })
    }

    engine.on('error', err => debug(err.stack))
    engine.isTrust = true
    engine._ready.go()
    return engine
  }

  addCallback (id, cb, isRPC) {
    cb.isRPC = isRPC
    callbacks[id] = cb
  }

  executeCallback (id, error, value) {
    debug(`executing callback: \nid: ${id}\nvalue: ${value}\nerror: ${error}\n`)
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

  sendAsync (payload, callback) {
    const self = this

    switch (payload.method) {
      case 'eth_accounts': {
        const { address } = globalSyncOptions,
              { id, jsonrpc } = payload

        callback(null, { id, jsonrpc, result: [address] })
        break
      }
      case 'eth_coinbase': {
        const { address: result } = globalSyncOptions,
              { id, jsonrpc } = payload

        callback(null, { id, jsonrpc, result })
        break
      }
      case 'net_version': {
        const { networkVersion: result } = globalSyncOptions,
              { id, jsonrpc } = payload

        callback(null, { id, jsonrpc, result })
        break
      }
      case 'net_listening': {
        const { id, jsonrpc } = payload
        callback(null, { id, jsonrpc, result: true })
        break
      }
      default: {
        if (!callback) {
          throw new Error('Trust web3 provider does not support synchronous requests.')
        } else {
          if (Array.isArray(payload)) {
            // handle batch
            map(payload, self._handleAsync.bind(self), callback)
          } else {
            // handle single
            self._handleAsync(payload, callback)
          }
        }
        break
      }
    }
  }

  send (payload, callback) {
    this.sendAsync(payload, callback)
  }

  isConnected() { return true }
}

if (typeof context.Trust === 'undefined') {
  context.Trust = TrustWeb3Provider
}

module.exports = TrustWeb3Provider
