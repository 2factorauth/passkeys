#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require 'algolia'
require 'dotenv/load'

ALGOLIA_APP_ID = ENV['ALGOLIA_APP_ID']
ALGOLIA_API_KEY = ENV['ALGOLIA_API_KEY']
ALGOLIA_INDEX_NAME = ENV['ALGOLIA_INDEX_NAME']

excludes = %w[notes documentation recovery passwordless mfa]
client = Algolia::Search::Client.create(ALGOLIA_APP_ID, ALGOLIA_API_KEY)
index = client.init_index(ALGOLIA_INDEX_NAME)
updates = []

diff = if ARGV[0].eql? '--all'
         Dir['entries/*/*.json']
       else
         `git diff --name-only #{ARGV[1] || 'HEAD^'} entries/`.split("\n")
       end

diff.each do |entry|
  if File.exist? entry
    name, data = JSON.parse(File.read(entry)).first
    puts "Updating #{name}"
    data.merge!({ 'name' => name, 'objectID' => File.basename(entry, '.*') })
    # Rename keys
    data['category'] = data.delete 'categories'

    %w[mfa passwordless].each do |key|
      next unless data.key?(key)

      data['supported'] ||= []
      data['supported'] << key
    end

    # Remove keys that shouldn't be searchable
    data.reject! { |k, _| excludes.include? k }
    updates.push data
  else
    domain = File.basename(entry, File.extname(entry))
    puts "Removing #{domain}"
    index.delete_object! domain
  end
end

res = index.save_objects(updates)
res.wait
