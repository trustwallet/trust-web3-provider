/* globals artifacts */
/* globals assert */
/* globals beforeEach */
/* globals contract */
/* globals it */
/* globals web3 */

const Ownable = artifacts.require('Ownable')

let ownable


contract('Ownable', function (accounts) {
  const ownerCandidate = accounts[1],
        shouldTest = web3.version && typeof web3.version === 'object' && /0\.20/.test(web3.version.api)

  beforeEach(async function () {
    const shouldRun = web3.toBigNumber && typeof web3.toBigNumber === 'function'

    if (shouldTest && shouldRun) {
      ownable = await Ownable.new()
    }
  })

  it('allows the owner to change ownership', async function () {
    if (shouldTest) {
      const ownerBefore = await ownable.owner.call()

      assert.equal(ownerBefore, accounts[0])

      await ownable.setOwner(ownerCandidate)

      const ownerAfter = await ownable.owner.call()

      assert.equal(ownerCandidate, ownerAfter)
    } else {
      this.skip()
    }
  })

  it('prevents ownership changes to address(0)', async function () {
    if (shouldTest) {
      const ownerBefore = await ownable.owner.call()

      assert.equal(ownerBefore, accounts[0])

      await reverts(ownable.setOwner('0x0000000000000000000000000000000000000000'))

      const ownerAfter = await ownable.owner.call()

      assert.equal(ownerBefore, accounts[0])
      assert.equal(ownerBefore, ownerAfter)
    } else {
      this.skip()
    }
  })

  it('prevents non-owners from making ownership changes', async function () {
    if (shouldTest) {
      const ownerBefore = await ownable.owner.call()

      assert.equal(ownerBefore, accounts[0])

      await reverts(ownable.setOwner(ownerCandidate, { from: accounts[2] }))

      const ownerAfter = await ownable.owner.call()

      assert.equal(ownerBefore, accounts[0])
      assert.equal(ownerBefore, ownerAfter)
    } else {
      this.skip()
    }
  })
})

async function reverts (p) {
  try {
    await p
    assert.fail('expected revert but ran to completion.')
  } catch (e) {
    const hasReverted = e.message.search(/revert/) > -1

    assert(hasReverted, `expected revert but threw ${e}`)
  }
}

