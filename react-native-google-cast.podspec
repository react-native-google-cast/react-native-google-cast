require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name     = 'NitroGoogleCast'
  s.version  = package['version']
  s.summary  = package['description']
  s.license  = package['license']
  s.authors  = package['contributors']
  s.homepage = package['homepage']

  # Google Cast SDK requires iOS 14+; RN 0.78 requires 15.1. Confirm in the v5
  # support matrix before release.
  s.platforms = { :ios => '15.1' }
  s.source    = {
    git: 'https://github.com/react-native-google-cast/react-native-google-cast.git',
    tag: s.version.to_s
  }

  s.source_files = [
    # Implementation (Swift)
    'ios/**/*.swift',
    # Autolinking/registration (Objective-C++)
    'ios/**/*.{m,mm}',
    # Implementation (C++)
    'cpp/**/*.{hpp,cpp}',
  ]

  # Google Cast SDK is a static framework.
  s.static_framework = true
  s.dependency 'google-cast-sdk'

  # Nitro autolinking + generated files.
  load 'nitrogen/generated/ios/NitroGoogleCast+autolinking.rb'
  add_nitrogen_files(s)

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  install_modules_dependencies(s)
end
