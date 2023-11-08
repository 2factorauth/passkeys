#!/usr/bin/env ruby
# frozen_string_literal: true

# This script validates common image mistakes.

require 'json'
require 'net/http'
require 'uri'
require 'parallel'

@status = 0
PNG_SIZE = [[32, 32], [64, 64], [128, 128]].freeze
seen_sites = []

def error(file, msg)
  puts "::error file=#{file}:: #{msg}"
  @status = 1
end

def alternative_src(image)
  res = Net::HTTP.get_response URI("https://api.2fa.directory/icons/#{image[0]}/#{image}")
  res.code.eql? '200'
end

Parallel.each(Dir.glob('entries/*/*.json'), in_threads: 16) do |file|
  website = JSON.parse(File.read(file)).values[0]
  domain = File.basename(file, '.*')
  img = website['img'] || "#{domain}.svg"
  path = "img/#{img[0]}/#{img}"
  unless File.exist?(path) || alternative_src(img)
    error(file, "Image does not exist for #{domain} - #{path} cannot be found.")
  end
  if website['img'].eql?("#{domain}.svg")
    error(file, "Defining the img property for #{domain} is not necessary. #{img} is the default value.")
  end
  seen_sites.push(path) if File.exist?(path)
end

Dir.glob('img/*/*') do |file|
  next if file.include? '/icons/'

  error(file, 'Unused image') unless seen_sites.include? file

  if file.include? '.png'
    dimensions = IO.read(file)[0x10..0x18].unpack('NN')
    unless PNG_SIZE.include? dimensions
      error(file, "PNGs must be one of the following sizes: #{PNG_SIZE.map { |a| a.join('x') }.join(', ')}.")
    end
  end
end

exit(@status)
