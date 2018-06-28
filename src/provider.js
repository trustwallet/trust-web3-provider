const inherits = require('util').inherits
const Subprovider = require('web3-provider-engine/subproviders/subprovider.js')

// wraps a provider in a subprovider interface

module.exports = ProviderSubprovider

inherits(ProviderSubprovider, Subprovider)

function ProviderSubprovider(provider){
  if (!provider) throw new Error('ProviderSubprovider - no provider specified')

  if (!provider.sendAsync) {

    // web3 1.0 
    if (!(provider.send && provider.send.length > 1)) {
      throw new Error('ProviderSubprovider - specified provider does not have a sendAsync method or a send method accepting two or more arguments')
    }
  }
  this.provider = provider
}

ProviderSubprovider.prototype.handleRequest = function(payload, next, end){

  const send = this.provider.sendAsync || this.provider.send,
        callback = function(err, response) {
          if (err) return end(err)
          if (response.error) return end(new Error(response.error.message))
          end(null, response.result)
        }

  send.apply(this.provider, [ payload, callback])
}
