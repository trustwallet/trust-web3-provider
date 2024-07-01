# Copyright © 2017-2022 Trust Wallet.
#
# This file is part of Trust. The full Trust copyright notice, including
# terms governing use, modification, and redistribution, is contained in the
# file LICENSE at the root of the source code distribution tree.

Pod::Spec.new do |s|
  s.name             = 'TrustWeb3Provider'
  s.version          = '1.0.0'
  s.summary          = 'Web3 javascript wrapper provider for iOS and Android platforms.'

  s.description      = <<-DESC
  Web3 javascript wrapper provider for iOS and Android platforms.
  The magic behind the dApps browsers
  DESC

  s.homepage         = 'https://github.com/TrustWallet/trust-web3-provider'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'hewigovens' => 'hewigovens@gmail.com', 'Viktor Radchenko' => 'vikmeup' }
  s.source           = { :git => 'https://github.com/TrustWallet/trust-web3-provider.git', :tag => s.version.to_s }
  s.social_media_url = 'https://twitter.com/TrustWallet'

  s.ios.deployment_target = '13.0'
  s.source_files = 'swift/*.swift'
  s.resource_bundles = {
    'TrustWeb3Provider' => ['swift/trust-min.js']
  }
end
