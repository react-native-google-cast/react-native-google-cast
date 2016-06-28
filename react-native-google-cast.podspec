require 'json'
package_json = JSON.parse(File.read('package.json'))

Pod::Spec.new do |s|

  s.name           = "react-native-google-cast"
  s.version        = package_json["version"]
  s.summary        = package_json["description"]
  s.license        = package_json["license"]
  s.author         = { package_json["author"] => package_json["author"]["name"] }
  s.platform       = :ios, "9.0"
  s.source         = { :git => package_json["repository"]["url"] }
  s.source_files   = 'ios/RNGoogleCast/*.{h,m}'
  s.dependency 'React'
  s.dependency 'google-cast-sdk'

end