require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name     = package['name']
  s.version  = package['version']
  s.summary  = package['description']
  s.license  = package['license']

  s.authors  = package['contributors']
  s.homepage = package['homepage']
  s.platform = :ios, '10.0'
  s.static_framework = true

  s.source = {
    git: 'https://github.com/react-native-google-cast/react-native-google-cast.git',
    tag: s.version.to_s
  }

  s.source_files = 'ios/RNGoogleCast/**/*.{h,m}'

  s.dependency 'google-cast-sdk'
  s.dependency 'PromisesObjC'
  s.dependency 'React'
end
