#!/usr/bin/env ruby
# frozen_string_literal: true

# This script warns when common PR mistakes are found.

require 'json'

# Fetch created (but not renamed) files in entries/**
diff = `git diff --name-only --diff-filter=Ard origin/master...HEAD entries/`.split("\n")

diff&.each do |path|
  entry = JSON.parse(File.read(path)).values[0]
  next unless entry.key? 'passkeys'

  # rubocop:disable Layout/LineLength
  puts "::warning file=#{path} title=Missing Documentation:: Since there is no documentation available, please could you provide us with screenshots of the setup/login process as evidence of 2FA? Please remember to block out any personal information." unless entry['documentation']
  # rubocop:enable Layout/LineLength
end
