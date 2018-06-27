const debug = require('debug')('TrustWeb3Provider'),
      eachSeries = require('async/eachSeries'),
      HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js'),
      map = require('async/map'),
      Provider = require('./provider'),
      Web3 = require('web3')

let context
if (typeof window === 'undefined') {
  context = global
} else {
  context = window
}

context.chrome = { webstore: true }

class TrustWeb3Provider {
  constructor (options) {
    const { rpcUrl, bypassHooks,  noConflict } = options

    this.options = options
    this.isTrust = true
    this._providers = []
    this.callbacks = {}

    if (!bypassHooks) {
      this.addProvider(new HookedWalletSubprovider(options))
    }

    if (options.wssUrl) {
      this.addProvider(new Provider(this.websocketProvider = new Web3.providers.WebsocketProvider(options.wssUrl)))
      this.addDefaultEvents = this.websocketProvider.addDefaultEvents.bind(this.websocketProvider)
      this.removeListener = this.websocketProvider.removeListener.bind(this.websocketProvider)
      this.removeAllListeners = this.websocketProvider.removeAllListeners.bind(this.websocketProvider)
      this.reset = this.websocketProvider.reset.bind(this.websocketProvider)
    } else {
      this.addProvider(new Provider(new Web3.providers.HttpProvider(rpcUrl)))
    }

    if (!noConflict) {
      const web3 = new Web3(this)
      context.Web3 = Web3
      web3.sha3 = web3.utils.sha3
      context.web3 = web3
    }
  }

  addProvider (source) {
    this._providers.push(source)
    source.setEngine(this)
  }

  addCallback (id, cb, isRPC) {
    cb.isRPC = isRPC
    this.callbacks[id] = cb
  }

  executeCallback (id, error, value) {
    debug(`executing callback: \nid: ${id}\nvalue: ${value}\nerror: ${error}\n`)
    let callback = this.callbacks[id]
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
    delete this.callbacks[id]
  }

  sendAsync (payload, callback) {
    const { bypassHooks } = this.options

    if (!bypassHooks) {
      switch (payload.method) {
        case 'eth_accounts': {
          const { address } = this.options,
                { id, jsonrpc } = payload

          callback(null, { id, jsonrpc, result: [address] })
          break
        }
        case 'eth_coinbase': {
          const { address: result } = this.options,
                { id, jsonrpc } = payload

          callback(null, { id, jsonrpc, result })
          break
        }
        case 'net_version': {
          const { networkVersion: result } = this.options,
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
          this.mapToHandler(payload, callback)
          break
        }
      }
    } else {
      this.mapToHandler(payload, callback)
    }
  }

  send (payload, callback) {
    this.sendAsync(payload, callback)
  }

  mapToHandler (payload, callback) {
    if (!callback) {
      throw new Error('Trust web3 provider does not support synchronous requests.')
    } else {
      if (Array.isArray(payload)) {
        // handle batch
        map(payload, this._handleAsync.bind(this), callback)
      } else {
        // handle single
        this._handleAsync(payload, callback)
      }
    }
  }

  _handleAsync (payload, finished) {
    const self = this
    let currentProvider = -1,
        stack = []

    next()

    function next (after) {
      currentProvider += 1

      stack.unshift(after)

      // bubbled down as far as we could go, and the request wasn't
      // handled return an error
      if (currentProvider >= self._providers.length) {
        end(new Error(`Request for method '${payload.method}' not handled by any Subprovider. Please check your subprovider configuration to ensure this method is handled.`))
      } else {
        try {
          const provider = self._providers[currentProvider]
          provider.handleRequest(payload, next, end)
        } catch (e) {
          end(e)
        }
      }
    }

    function end (error, result) {
      eachSeries(stack, function (fn, callback) {
        if (fn) {
          fn(error, result, callback)
        } else {
          callback()
        }
      }, function () {
        const { id, jsonrpc } = payload

        if (error) {
          finished(error, { error, message: error.stack || error.message || error, id, jsonrpc, code: -32000 })
        } else {
          finished(null, { id, jsonrpc, result })
        }
      })
    }
  }

  on (type, callback) {
    if (this.websocketProvider) {
      this.websocketProvider.on(type, callback)
    }
  }

  isConnected() { return true }
}

if (typeof context.Trust === 'undefined') {
  context.Trust = TrustWeb3Provider
}

module.exports = TrustWeb3Provider
