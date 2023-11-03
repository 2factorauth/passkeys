#!/usr/bin/env ruby
# frozen_string_literal: true

# This script validates the JSON data of files in entries/.

require 'json_schemer'
require 'parallel'

status = 0
@seen_names = []

def valid_schema(data)
  schema = JSONSchemer.schema(File.read('tests/schema.json'))
  schema.valid?(data) ? Array(nil) : schema.validate(data)
end

def valid_domain(file, data)
  domain = File.basename(file, '.*')
  url = data.values[0]['url']
  default_url = "https://#{domain}"
  return unless !url.nil? && (url.eql?(default_url) || url.eql?("#{default_url}/"))

  raise "Defining the url property for #{domain} is not necessary - '#{default_url}' is the default value"
end

def valid_directory(file)
  folder_name = file.split('/')[1]
  expected_folder_name = File.basename(file, '.*')[0]

  return if folder_name.eql? expected_folder_name

  raise "Entry should be in the subdirectory with the same name as the first letter as the domain. \n
         Received: entries/#{folder_name}. Expected: entries/#{expected_folder_name}"
end

def unique_name(data)
  name = data.keys[0]
  return @seen_names.push name unless @seen_names.include? name

  raise "An entry with the name '#{name}' already exists. Duplicate site names are not allowed."
end

Parallel.each(Dir.glob('entries/*/*.json'), in_threads: 16) do |file|
  data = JSON.parse(File.read(file))
  (valid_schema data)&.each do |v|
    puts ''
    puts "::error file=#{file}:: '#{v['type'].capitalize}' error in #{file}"
    puts "- tag: #{v['data_pointer'].split('/')[2]}" if v['data_pointer'].split('/').length >= 3
    puts "  data: #{v['data']}" if v['details'].nil?
    puts "  data: #{v['details']}" unless v['details'].nil?
    puts "  expected: #{v['schema']['pattern']}" if v['type'].eql?('pattern')
    puts "  expected: #{v['schema']['format']}" if v['type'].eql?('format')
    puts "  expected: #{v['schema']['required']}" if v['type'].eql?('required')
    puts "  expected: only one of 'passkeys' or 'contact'" if v['type'].eql?('oneOf')
    puts "  expected: 'passkeys' to contain '#{v['schema']['contains']['const']}'" if v['type'].eql?('contains')
    status = 1
  end

  valid_directory file

  valid_domain file, data

  unique_name data
rescue JSON::ParserError => e
  puts "::error file=#{file}:: #{e.message}"
  return 1
rescue StandardError => e
  status = 1
  puts "::error file=#{file}:: #{e.message}"
end

exit(status)
