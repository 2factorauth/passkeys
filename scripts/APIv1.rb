#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
@entries = 'entries/*/*.json'

# This function generates all public API files that have unnecessary data removed.
# @return [Integer] Returns exit code
def public_api
  all = {}
  passwordless = {}
  mfa = {}
  path = 'public/api/v1'

  Dir.glob(@entries) { |file| all[File.basename(file, '.*')] = JSON.parse(File.read(file)).values[0] }
  all.sort.to_h.each do |_, entry|
    entry['additional-domains']&.each do |domain|
      all[domain] = entry.reject { |key| key == 'additional-domains' }
    end
    entry.delete('additional-domains')
    entry.delete('img')
    entry.delete('categories')
  end

  all.to_h.each do |k, v|
    mfa[k] = v if v['mfa']
    passwordless[k] = v if v['passwordless']
  end

  { 'all' => all, 'mfa' => mfa, 'passwordless' => passwordless }.each do |k, v|
    File.open("#{path}/#{k}.json", 'w') { |file| file.write v.sort_by { |a, _| a.downcase }.to_h.to_json }
  end

  File.open("#{path}/supported.json", 'w') do |file|
    file.write all.select { |_, v| v.keys.any? { |k| k.match(/mfa|passwordless/) } }.sort_by { |k, _| k.downcase }.to_h.to_json
  end
end

# This function generates API files designed for the public interface of this project.
# @return [Integer] returns exit code
def private_api
  all = {}
  regions = {}
  path = 'public/api/private'

  Dir.glob(@entries) { |file| all[JSON.parse(File.read(file)).keys[0]] = JSON.parse(File.read(file)).values[0] }

  all.sort.to_h.each do |_, entry|
    entry['regions']&.each do |region|
      next if region[0] == '-'

      regions[region] = {} unless regions.key? region
      regions[region]['count'] = 1 + regions[region]['count'].to_i
    end
    entry['categories'] = Array(entry['categories']) if entry.key?('categories')
    entry.delete 'additional-domains'
  end

  regions['int'] = { 'count' => all.length, 'selection' => true }

  File.open("#{path}/all.json", 'w') do |file|
    file.write all.sort_by { |a, _| a.downcase }.to_h.to_json
  end
  File.open("#{path}/regions.json", 'w') do |file|
    file.write regions.sort_by { |_, v| v['count'] }.reverse!.to_h.to_json
  end
end

public_api
private_api
