/* globals artifacts */
/* globals assert */
/* globals beforeEach */
/* globals contract */
/* globals it */
const Ownable = artifacts.require('Ownable')

let ownable


contract('Ownable', function (accounts) {
  const ownerCandidate = accounts[1]

  beforeEach(async function () {
    ownable = await Ownable.new()
  })

  it('allows the owner to change ownership', async function () {
    const ownerBefore = await ownable.owner.call()

    assert.equal(ownerBefore, accounts[0])

    await ownable.setOwner(ownerCandidate)

    const ownerAfter = await ownable.owner.call()

    assert.equal(ownerCandidate, ownerAfter)
  })

  it('prevents ownership changes to address(0)', async function () {
    const ownerBefore = await ownable.owner.call()

    assert.equal(ownerBefore, accounts[0])

    await reverts(ownable.setOwner('0x0000000000000000000000000000000000000000'))

    const ownerAfter = await ownable.owner.call()

    assert.equal(ownerBefore, accounts[0])
    assert.equal(ownerBefore, ownerAfter)
  })

  it('prevents non-owners from making ownership changes', async function () {
    
    const ownerBefore = await ownable.owner.call()

    assert.equal(ownerBefore, accounts[0])

    await reverts(ownable.setOwner(ownerCandidate, { from: accounts[2] }))

    const ownerAfter = await ownable.owner.call()

    assert.equal(ownerBefore, accounts[0])
    assert.equal(ownerBefore, ownerAfter)
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

