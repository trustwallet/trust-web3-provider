/* globals assert */
/* globals describe */
/* globals it */
/* globals web3 */

const Trust = require('../src/index'),
      Web3One = require('web3')

describe('trust web3.eth', function () {
  it('can get accounts', async function () {
    const trust = new Trust({ rpcUrl: web3.currentProvider.host, bypassHooks: true, noConflict: true}),
          trust3 = new Web3One(trust)

    const accounts = await trust3.eth.getAccounts()

    assert(Array.isArray(accounts))
    assert(accounts.length)
  })

  it('can send a ETH from one account to another', async function () {
    const trust = new Trust({ rpcUrl: web3.currentProvider.host, bypassHooks: true, noConflict: true}),
          trust3 = new Web3One(trust)

    const accounts = await trust3.eth.getAccounts(),
          [ from, to ] = accounts

    const receipt = await trust3.eth.sendTransaction({ from, to, value: '1e17' })
    
    assert(receipt.status)
  })
})

