#
# Be sure to run `pod lib lint trust-web3-provider.podspec' to ensure this is a
# valid spec before submitting.
#
# Any lines starting with a # are optional, but their use is encouraged
# To learn more about a Podspec see http://guides.cocoapods.org/syntax/podspec.html
#

Pod::Spec.new do |s|
  s.name             = 'TrustWeb3Provider'
  s.version          = '0.1.4'
  s.summary          = 'A short description of trust-web3-provider.'

# This description is used to generate tags and improve search results.
#   * Think: What does it do? Why did you write it? What is the focus?
#   * Try to keep it short, snappy and to the point.
#   * Write the description between the DESC delimiters below.
#   * Finally, don't worry about the indent, CocoaPods strips it!

  s.description      = <<-DESC
TODO: Add long description of the pod here.
                       DESC

  s.homepage         = 'https://github.com/Viktor Radchenko/trust-web3-provider'
  # s.screenshots     = 'www.example.com/screenshots_1', 'www.example.com/screenshots_2'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'Viktor Radchenko' => 'yazexel@gmail.com' }
  s.source           = { :git => 'https://github.com/Viktor Radchenko/trust-web3-provider.git', :tag => s.version.to_s }
  # s.social_media_url = 'https://twitter.com/<TWITTER_USERNAME>'

  s.ios.deployment_target = '8.0'

  s.source_files = 'trust-web3-provider/trust-web3-provider/Classes/**/*'
  
  s.resource_bundles = {
    'TrustWeb3Provider' => [
      'JS/dist/trust-min.js',
      'trust-web3-provider/trust-web3-provider/Assets/*.png'
      ]
  }

  # s.public_header_files = 'Pod/Classes/**/*.h'
  # s.frameworks = 'UIKit', 'MapKit'
  # s.dependency 'AFNetworking', '~> 2.3'
end
