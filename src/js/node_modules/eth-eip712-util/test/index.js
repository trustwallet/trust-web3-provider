const test = require('tape')
const sigUtil = require('../')
const { bufferToHex } = require('../util')

test('hashForSignTypedDataLegacy - single message', function (t) {
  t.plan(1)
  const typedData = [
    {
      type: 'string',
      name: 'message',
      value: 'Hi, Alice!'
    }
  ]

  const hash = sigUtil.hashForSignTypedDataLegacy({ data: typedData })
  t.equal(
    bufferToHex(hash),
    '0x14b9f24872e28cc49e72dc104d7380d8e0ba84a3fe2e712704bcac66a5702bd5'
  )
})

test('hashForSignTypedDataLegacy - multiple messages', function (t) {
  t.plan(1)
  const typedData = [
    {
      type: 'string',
      name: 'message',
      value: 'Hi, Alice!'
    },
    {
      type: 'uint8',
      name: 'value',
      value: 10
    },
  ]

  const hash = sigUtil.hashForSignTypedDataLegacy({ data: typedData })
  t.equal(
    bufferToHex(hash),
    '0xf7ad23226db5c1c00ca0ca1468fd49c8f8bbc1489bc1c382de5adc557a69c229'
  )
})

test('hashForSignTypedDataLegacy - bytes', function (t) {
    t.plan(1)
    const typedData = [
        {
            type: 'bytes',
            name: 'message',
            value: '0xdeadbeaf'
        }
    ]

    const hash = sigUtil.hashForSignTypedDataLegacy({ data: typedData })
    t.equal(
      bufferToHex(hash),
      '0x6c69d03412450b174def7d1e48b3bcbbbd8f51df2e76e2c5b3a5d951125be3a9'
    )
})

hashForSignedTypeDataLegacyThrowsTest({
    testLabel: 'empty array',
    argument: []
})

hashForSignedTypeDataLegacyThrowsTest({
    testLabel: 'not array',
    argument: 42
})

hashForSignedTypeDataLegacyThrowsTest({
    testLabel: 'null',
    argument: null
})

hashForSignedTypeDataLegacyThrowsTest({
  testLabel: 'wrong type',
  argument: [
    {
      type: 'jocker',
      name: 'message',
      value: 'Hi, Alice!'
    }
  ]
})

hashForSignedTypeDataLegacyThrowsTest({
  testLabel: 'no type',
  argument: [
    {
      name: 'message',
      value: 'Hi, Alice!'
    }
  ]
})

hashForSignedTypeDataLegacyThrowsTest({
  testLabel: 'no name',
  argument: [
    {
      type: 'string',
      value: 'Hi, Alice!'
    }
  ]
})

function hashForSignedTypeDataLegacyThrowsTest(opts) {
  const label = `hashForSignedTypeDataLegacyThrowsTest - malformed arguments - ${opts.testLabel}`
  test(label, function (t) {
    t.plan(1)

    const argument = opts.argument

    t.throws(() => {
      sigUtil.hashForSignTypedDataLegacy({ data: argument })
    })
  })
}

test('hashForSignTypedData_v3', (t) => {
  t.plan(7)

  const typedData = {
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
        ],
        Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' }
        ],
    },
    primaryType: 'Mail',
    domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    message: {
        from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
    },
  }

  const utils = sigUtil.TypedDataUtils
  const hash = sigUtil.hashForSignTypedData_v3({ data: typedData })

  t.equal(utils.encodeType('Mail', typedData.types),
    'Mail(Person from,Person to,string contents)Person(string name,address wallet)')
  t.equal(bufferToHex(utils.hashType('Mail', typedData.types)),
    '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2')
  t.equal(bufferToHex(utils.encodeData(typedData.primaryType, typedData.message, typedData.types)),
    '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2fc71e5fa27ff56c350aa531bc129ebdf613b772b6604664f5d8dbe21b85eb0c8cd54f074a4af31b4411ff6a60c9719dbd559c221c8ac3492d9d872b041d703d1b5aadf3154a261abdd9086fc627b61efca26ae5702701d05cd2305f7c52a2fc8')
  t.equal(bufferToHex(utils.hashStruct(typedData.primaryType, typedData.message, typedData.types)),
    '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e')
  t.equal(bufferToHex(utils.hashStruct('EIP712Domain', typedData.domain, typedData.types)),
    '0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f')
  t.equal(bufferToHex(utils.hash(typedData)),
    '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2')
  t.equal(bufferToHex(hash),
    '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2')
})

test('hashForSignTypedData_v4', (t) => {
  t.plan(14)

  const typedData = {
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
            { name: 'name', type: 'string' },
            { name: 'wallets', type: 'address[]' },
        ],
        Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person[]' },
            { name: 'contents', type: 'string' },
        ],
        Group: [
            { name: 'name', type: 'string' },
            { name: 'members', type: 'Person[]' },
        ],
    },
    domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    primaryType: 'Mail',
    message: {
        from: {
            name: 'Cow',
            wallets: [
              '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
              '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
            ],
        },
        to: [{
            name: 'Bob',
            wallets: [
              '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
              '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
              '0xB0B0b0b0b0b0B000000000000000000000000000'
            ]
        }],
        contents: 'Hello, Bob!',
    },
  }

  const utils = sigUtil.TypedDataUtils

  t.equal(utils.encodeType('Group', typedData.types),
    'Group(string name,Person[] members)Person(string name,address[] wallets)')

  t.equal(utils.encodeType('Person', typedData.types),
    'Person(string name,address[] wallets)')
  t.equal(bufferToHex(utils.hashType('Person', typedData.types)),
    '0xfabfe1ed996349fc6027709802be19d047da1aa5d6894ff5f6486d92db2e6860')

  t.equal(bufferToHex(utils.encodeData('Person', typedData.message.from, typedData.types)),
    '0x' + [
      'fabfe1ed996349fc6027709802be19d047da1aa5d6894ff5f6486d92db2e6860',
      '8c1d2bd5348394761719da11ec67eedae9502d137e8940fee8ecd6f641ee1648',
      '8a8bfe642b9fc19c25ada5dadfd37487461dc81dd4b0778f262c163ed81b5e2a',
    ].join('')
  )
  t.equal(bufferToHex(utils.hashStruct('Person', typedData.message.from, typedData.types)),
    '0x9b4846dd48b866f0ac54d61b9b21a9e746f921cefa4ee94c4c0a1c49c774f67f')

  t.equal(bufferToHex(utils.encodeData('Person', typedData.message.to[0], typedData.types)),
    '0x' + [
      'fabfe1ed996349fc6027709802be19d047da1aa5d6894ff5f6486d92db2e6860',
      '28cac318a86c8a0a6a9156c2dba2c8c2363677ba0514ef616592d81557e679b6',
      'd2734f4c86cc3bd9cabf04c3097589d3165d95e4648fc72d943ed161f651ec6d',
    ].join('')
  )
  t.equal(bufferToHex(utils.hashStruct('Person', typedData.message.to[0], typedData.types)),
    '0xefa62530c7ae3a290f8a13a5fc20450bdb3a6af19d9d9d2542b5a94e631a9168')

  t.equal(utils.encodeType('Mail', typedData.types),
    'Mail(Person from,Person[] to,string contents)Person(string name,address[] wallets)')
  t.equal(bufferToHex(utils.hashType('Mail', typedData.types)),
    '0x4bd8a9a2b93427bb184aca81e24beb30ffa3c747e2a33d4225ec08bf12e2e753')
  t.equal(bufferToHex(utils.encodeData(typedData.primaryType, typedData.message, typedData.types)),
    '0x' + [
      '4bd8a9a2b93427bb184aca81e24beb30ffa3c747e2a33d4225ec08bf12e2e753',
      '9b4846dd48b866f0ac54d61b9b21a9e746f921cefa4ee94c4c0a1c49c774f67f',
      'ca322beec85be24e374d18d582a6f2997f75c54e7993ab5bc07404ce176ca7cd',
      'b5aadf3154a261abdd9086fc627b61efca26ae5702701d05cd2305f7c52a2fc8',
    ].join('')
  )
  t.equal(bufferToHex(utils.hashStruct(typedData.primaryType, typedData.message, typedData.types)),
    '0xeb4221181ff3f1a83ea7313993ca9218496e424604ba9492bb4052c03d5c3df8')
  t.equal(bufferToHex(utils.hashStruct('EIP712Domain', typedData.domain, typedData.types)),
    '0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f')
  t.equal(bufferToHex(utils.hash(typedData)),
    '0xa85c2e2b118698e88db68a8105b794a8cc7cec074e89ef991cb4f5f533819cc2')

  const hash = sigUtil.hashForSignTypedData_v4({ data: typedData })
  t.equal(bufferToHex(hash),
    '0xa85c2e2b118698e88db68a8105b794a8cc7cec074e89ef991cb4f5f533819cc2')
})

test('hashForSignTypedData_v4 with recursive types', (t) => {
  t.plan(11)

  const typedData = {
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
            { name: 'name', type: 'string' },
            { name: 'mother', type: 'Person' },
            { name: 'father', type: 'Person' },
        ]
    },
    domain: {
        name: 'Family Tree',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    primaryType: 'Person',
    message: {
        name: 'Jon',
        mother: {
          name: 'Lyanna',
          father: {
            name: 'Rickard',
          },
        },
        father: {
          name: 'Rhaegar',
          father: {
            name: 'Aeris II',
          }
        },
    },
  }

  const utils = sigUtil.TypedDataUtils

  t.equal(utils.encodeType('Person', typedData.types),
    'Person(string name,Person mother,Person father)')

  t.equal(bufferToHex(utils.hashType('Person', typedData.types)),
    '0x7c5c8e90cb92c8da53b893b24962513be98afcf1b57b00327ae4cc14e3a64116')

  t.equal(bufferToHex(utils.encodeData('Person', typedData.message.mother, typedData.types)),
    '0x' + [
      '7c5c8e90cb92c8da53b893b24962513be98afcf1b57b00327ae4cc14e3a64116',
      'afe4142a2b3e7b0503b44951e6030e0e2c5000ef83c61857e2e6003e7aef8570',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '88f14be0dd46a8ec608ccbff6d3923a8b4e95cdfc9648f0db6d92a99a264cb36',
    ].join('')
  )
  t.equal(bufferToHex(utils.hashStruct('Person', typedData.message.mother, typedData.types)),
    '0x9ebcfbf94f349de50bcb1e3aa4f1eb38824457c99914fefda27dcf9f99f6178b')

  t.equal(bufferToHex(utils.encodeData('Person', typedData.message.father, typedData.types)),
    '0x' + [
      '7c5c8e90cb92c8da53b893b24962513be98afcf1b57b00327ae4cc14e3a64116',
      'b2a7c7faba769181e578a391a6a6811a3e84080c6a3770a0bf8a856dfa79d333',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '02cc7460f2c9ff107904cff671ec6fee57ba3dd7decf999fe9fe056f3fd4d56e',
    ].join('')
  )
  t.equal(bufferToHex(utils.hashStruct('Person', typedData.message.father, typedData.types)),
    '0xb852e5abfeff916a30cb940c4e24c43cfb5aeb0fa8318bdb10dd2ed15c8c70d8')

  t.equal(bufferToHex(utils.encodeData(typedData.primaryType, typedData.message, typedData.types)),
    '0x' + [
      '7c5c8e90cb92c8da53b893b24962513be98afcf1b57b00327ae4cc14e3a64116',
      'e8d55aa98b6b411f04dbcf9b23f29247bb0e335a6bc5368220032fdcb9e5927f',
      '9ebcfbf94f349de50bcb1e3aa4f1eb38824457c99914fefda27dcf9f99f6178b',
      'b852e5abfeff916a30cb940c4e24c43cfb5aeb0fa8318bdb10dd2ed15c8c70d8',
    ].join('')
  )
  t.equal(bufferToHex(utils.hashStruct(typedData.primaryType, typedData.message, typedData.types)),
    '0xfdc7b6d35bbd81f7fa78708604f57569a10edff2ca329c8011373f0667821a45')
  t.equal(bufferToHex(utils.hashStruct('EIP712Domain', typedData.domain, typedData.types)),
    '0xfacb2c1888f63a780c84c216bd9a81b516fc501a19bae1fc81d82df590bbdc60')
  t.equal(bufferToHex(utils.hash(typedData)),
    '0x807773b9faa9879d4971b43856c4d60c2da15c6f8c062bd9d33afefb756de19c')

  const hash = sigUtil.hashForSignTypedData_v4({ data: typedData })
  t.equal(bufferToHex(hash),
    '0x807773b9faa9879d4971b43856c4d60c2da15c6f8c062bd9d33afefb756de19c')
})
