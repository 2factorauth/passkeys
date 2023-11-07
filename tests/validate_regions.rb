#!/usr/bin/env ruby
# frozen_string_literal: true

# This script validates region codes set in entries.

require 'uri'
require 'net/http'
require 'json'

list_url = 'https://raw.githubusercontent.com/stefangabos/world_countries/master/data/countries/en/world.json'
code_cache = '/tmp/iso-3166.txt'
headers = { 'Accept' => 'application/json',
            'User-Agent' => '2FactorAuth/RegionValidator' \
              "(Ruby/#{RUBY_VERSION}; +https://2fa.directory/bot)",
            'From' => 'https://2fa.directory/' }
countries = []
if File.exist?(code_cache)
  countries = JSON.parse(File.read(code_cache.to_s))
else
  response = Net::HTTP.get_response(URI(list_url), headers)

  raise("Request failed. Check URL & API key. (#{response.code})") unless response.code == '200'

  # Get region codes from body & store in cache file
  JSON.parse(response.body).each { |v| countries.push(v['alpha2'].downcase) }
  File.open(code_cache, 'w') { |file| file.write countries.to_json }
end
res = Net::HTTP.get_response(URI('https://raw.githubusercontent.com/2factorauth/passkeys.2fa.directory/master/data/region_identifiers.json'), headers)
regions = JSON.parse(res.body)

status = 0

begin
  Dir.glob('entries/*/*.json') do |file|
    website = JSON.parse(File.read(file)).values[0]
    next if website['regions'].nil?

    website['regions'].map! { |region_code| region_code.tr('-', '') }
    website['regions'].each do |region|
      next if countries.include?(region)
      next if regions.include?(region)

      puts "::error file=#{file}:: \"#{region}\" is not a real ISO 3166-2 code."
      status = 1
    end
  end
rescue StandardError => e
  puts e.message
  status = 1
end

exit(status)
