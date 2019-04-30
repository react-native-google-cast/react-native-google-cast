require 'json'
package = JSON.parse(File.read(File.join(__dir__, '../', 'package.json')))

Pod::Spec.new do |s|
  s.name          = package['name']
  s.version       = package['version']
  s.summary       = package['description']

  s.author        = { 'petrbela' => 'github@petrbela.com' }
  s.homepage      = 'https://github.com/react-native-google-cast/react-native-google-cast'
  s.license       = package['license']
  s.platform      = :ios, '9.0'

  s.source        = { :git => 'https://github.com/react-native-google-cast/react-native-google-cast.git', :tag => s.version.to_s }
  s.source_files  = 'RNGoogleCast/**/*.{h,m}'

  s.dependency      'React'
  s.dependency      'google-cast-sdk', '>= 3'
end
